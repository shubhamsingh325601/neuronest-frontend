// Measures the client assets the landing route ("/") loads, from `.next` build output.
// Next 16 no longer prints "First Load JS", so we read the prerendered HTML and sum
// every JS chunk it references (script tags + preloads), raw and gzipped.
//
//   node scripts/measure-landing-js.mjs                  print the measurement
//   node scripts/measure-landing-js.mjs --write <file>   save it as the baseline
//   node scripts/measure-landing-js.mjs --check <file>   compare with a baseline (exit 1 on JS growth)
//
// Run `npm run build` first.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = ".next";
const HTML = join(DIST, "server", "app", "index.html");
// Tolerated growth (gzip bytes) before --check fails; chunk hashing shuffles a few bytes around.
const TOLERANCE_GZIP_BYTES = 1024;

function measure() {
  if (!existsSync(HTML)) {
    throw new Error(`${HTML} not found. Run \`npm run build\` first.`);
  }
  const html = readFileSync(HTML, "utf8");
  const refs = [...new Set(html.match(/\/_next\/static\/[^"'\\\s)]+\.(?:js|css|woff2)/g) ?? [])].sort();

  const files = refs.map((ref) => {
    const buf = readFileSync(join(DIST, ref.replace("/_next/", "")));
    return {
      file: ref.replace("/_next/static/", ""),
      type: ref.split(".").pop(),
      bytes: buf.length,
      gzipBytes: gzipSync(buf).length,
    };
  });

  const sum = (type, key) =>
    files.filter((f) => f.type === type).reduce((n, f) => n + f[key], 0);

  return {
    route: "/",
    source: HTML.replaceAll("\\", "/"),
    totals: {
      jsFiles: files.filter((f) => f.type === "js").length,
      jsBytes: sum("js", "bytes"),
      jsGzipBytes: sum("js", "gzipBytes"),
      cssBytes: sum("css", "bytes"),
      cssGzipBytes: sum("css", "gzipBytes"),
      fontBytes: sum("woff2", "bytes"),
    },
    files,
  };
}

const [flag, target] = process.argv.slice(2);
const current = measure();

if (flag === "--write") {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(current, null, 2) + "\n");
  console.log(`Baseline written to ${target}`);
  console.log(current.totals);
} else if (flag === "--check") {
  const baseline = JSON.parse(readFileSync(target, "utf8"));
  const rows = Object.keys(current.totals).map((k) => ({
    metric: k,
    baseline: baseline.totals[k],
    current: current.totals[k],
    delta: current.totals[k] - baseline.totals[k],
  }));
  console.table(rows);
  const growth = current.totals.jsGzipBytes - baseline.totals.jsGzipBytes;
  if (growth > TOLERANCE_GZIP_BYTES) {
    console.error(`Landing client JS grew by ${growth} gzip bytes (> ${TOLERANCE_GZIP_BYTES}).`);
    process.exit(1);
  }
  console.log("Landing client JS within tolerance of the baseline.");
} else {
  console.log(JSON.stringify(current, null, 2));
}
