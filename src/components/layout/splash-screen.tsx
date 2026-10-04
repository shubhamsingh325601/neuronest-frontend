"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  animate,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { siteConfig } from "@/content/site";

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */
const FLIGHT_DELAY = 0.2;
const FLIGHT_DURATION = 1.7;
const LANDING_AT = FLIGHT_DELAY + FLIGHT_DURATION; // bird touches the nest
const REVEAL_AT_MS = (LANDING_AT + 0.35) * 1000; // iris opens just after settling
const REVEAL_DURATION = 1.25;

/* ------------------------------------------------------------------ */
/* Pre-computed smooth flight path                                     */
/* Dense linear samples of a continuous curve = no stop/start jerks.   */
/* ------------------------------------------------------------------ */
const SAMPLES = 64;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Cubic bezier: a long gliding descent that flattens out into the nest.
const P0 = { x: -135, y: -88 };
const P1 = { x: -70, y: -92 };
const P2 = { x: -34, y: -30 };
const P3 = { x: 0, y: 3 };

function bezier(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

const flight = Array.from({ length: SAMPLES + 1 }, (_, i) => {
  const t = i / SAMPLES;
  // Ease-out so the bird decelerates gently as it arrives
  const s = 1 - Math.pow(1 - t, 2.2);
  const flare = Math.sin(Math.PI * clamp01((t - 0.62) / 0.38));
  const amp = Math.pow(1 - t, 1.2);
  const beat = (t: number) => 2 * Math.PI * 6 * Math.pow(t, 0.88); // slows as it lands
  return {
    t,
    x: bezier(s, P0.x, P1.x, P2.x, P3.x),
    y: bezier(s, P0.y, P1.y, P2.y, P3.y),
    // nose-down on approach, nose-up flare just before touchdown, level at rest
    rotate: 13 * Math.pow(1 - t, 1.6) - 7 * flare,
    scale: 0.72 + 0.28 * (1 - Math.pow(1 - t, 2)),
    // wings: decaying beats that fold in softly on the nest
    wingBack: -34 * amp * Math.sin(beat(t)) + 6 * amp,
    wingFront: -44 * amp * Math.sin(beat(t) + 0.25) + 8 * amp,
    // body rises/falls with each beat
    bob: -2.6 * amp * Math.sin(beat(t) + 1.1),
    // tail trails in flight, then settles raised above the rim (no sweep across the nest)
    tail: -4 * amp + 14 * (1 - amp),
  };
});

const times = flight.map((f) => f.t);
const pick = (k: keyof (typeof flight)[number]) => flight.map((f) => f[k]);

/* ------------------------------------------------------------------ */
/* Nest geometry                                                       */
/* ------------------------------------------------------------------ */
const BOWL = "M50 121 C52 152 188 152 190 121 C165 133 75 133 50 121Z";
const STRAND_COLORS = ["#A97B22", "#C4922E", "#D4A338", "#B88626", "#C4922E"];

const strands = Array.from({ length: 5 }, (_, k) => ({
  d: `M${48 + k * 3} ${124 + k * 5} C${72 + k * 2} ${142 + k * 5} ${168 - k * 2} ${142 + k * 5} ${192 - k * 3} ${124 + k * 5}`,
  color: STRAND_COLORS[k],
  w: 2.6 - k * 0.1,
}));

const weave = Array.from({ length: 13 }, (_, i) => {
  const x = 52 + i * 11;
  const lean = i % 2 === 0 ? 15 : -15;
  return {
    d: `M${x} 121 L${x + lean} 152`,
    color: i % 3 === 0 ? "#A97B22" : i % 3 === 1 ? "#D4A338" : "#B88626",
  };
});

// Slightly wild twig ends poking out of the rim for a hand-woven feel
const strayTwigs = [
  "M52 122 L41 115",
  "M60 126 L49 124",
  "M75 129 L68 135",
  "M188 122 L199 114",
  "M180 127 L191 126",
  "M166 130 L172 136",
];

// Both nest layers share the same entrance + touchdown "give"
const nestEntrance = {
  initial: { opacity: 0, scale: 0.92, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};
const nestGive = {
  animate: { y: [0, 2.5, 2.5], scaleY: [1, 0.98, 0.98] },
  transition: {
    delay: LANDING_AT - 0.1,
    duration: 0.6,
    times: [0, 0.6, 1],
    ease: "easeOut" as const,
  },
  style: { originX: "120px", originY: "148px" },
};

/* ------------------------------------------------------------------ */
/* Chicks — peek out of the nest, perk up and chirp when mum lands     */
/* ------------------------------------------------------------------ */
function Chick({
  x,
  y = 111,
  size = 1,
  flip = false,
  delay = 0,
}: {
  x: number;
  y?: number;
  size?: number;
  flip?: boolean;
  delay?: number;
}) {
  const wake = LANDING_AT + 0.1 + delay;
  const rise = 0.9 + delay;
  const total = wake + 1.2 - rise;
  const wakeAt = (wake - 0.1 - rise) / total;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -size : size} ${size})`}>
      <motion.g
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: [12, 0, 0, -3, 0, -2, 0], opacity: 1 }}
        transition={{
          y: {
            delay: rise,
            duration: total,
            times: [0, 0.15, wakeAt, wakeAt + 0.06, wakeAt + 0.12, wakeAt + 0.18, 1],
            ease: "easeOut",
          },
          opacity: { delay: rise, duration: 0.4 },
        }}
      >
        <ellipse cx="0" cy="9" rx="10" ry="9" fill="#F0A48B" />
        <circle cx="0" cy="0" r="9" fill="#F0A48B" />
        <path d="M-9 4 C-6 10 6 10 9 4 C7 12 -7 12 -9 4Z" fill="#FBE3DA" opacity="0.8" />
        {/* downy tuft */}
        <path d="M-2 -8 C-3 -13 -1 -14 0 -11 C1 -14 3 -13 2 -8Z" fill="#E2775B" />
        {/* eyes: sleepy at first, wide open once mum arrives */}
        {[-3.5, 3.5].map((ex) => (
          <motion.ellipse
            key={ex}
            cx={ex}
            cy="-1"
            rx="1.5"
            ry="1.6"
            fill="#332C26"
            initial={{ scaleY: 0.15 }}
            animate={{ scaleY: [0.15, 1] }}
            transition={{ delay: wake, duration: 0.3 }}
            style={{ originX: `${ex}px`, originY: "-1px" }}
          />
        ))}
        {/* chirping beak */}
        <motion.g
          initial={{ scaleY: 0.3 }}
          animate={{ scaleY: [0.3, 1.25, 0.5, 1.25, 0.5, 1.1] }}
          transition={{ delay: wake + 0.15, duration: 1.4, ease: "easeInOut" }}
          style={{ originX: "0px", originY: "4px" }}
        >
          <path d="M-4 4 L4 4 L0 11 Z" fill="#A64B32" />
          <path d="M-4 4 L4 4 L0 1 Z" fill="#C4922E" />
        </motion.g>
      </motion.g>
    </g>
  );
}

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);

  // Iris-reveal: radius of the transparent "hole" that opens from the nest
  const radius = useMotionValue(-90);
  const edge = useTransform(radius, (r) => r + 110); // soft feathered edge
  const mask = useMotionTemplate`radial-gradient(circle at 50% 50%, transparent ${radius}px, #000 ${edge}px)`;

  useEffect(() => {
    const isPending =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("splash-pending");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const hasSeen = sessionStorage.getItem("neuronest_splash_seen");

    if ((isPending || !hasSeen) && !prefersReducedMotion) {
      // Mount on the next frame rather than synchronously in the effect body (avoids a cascading
      // render). The page is hidden by `splash-pending` and shares the splash's background, so
      // this is not visible.
      const frame = requestAnimationFrame(() => setIsVisible(true));

      const maxRadius =
        Math.hypot(window.innerWidth, window.innerHeight) * 0.55 + 120;
      let controls: ReturnType<typeof animate> | undefined;

      const timer = setTimeout(() => {
        // Page goes live underneath; the veil opens over it from the nest
        document.documentElement.classList.remove("splash-pending");
        sessionStorage.setItem("neuronest_splash_seen", "true");

        controls = animate(radius, maxRadius, {
          duration: REVEAL_DURATION,
          ease: [0.65, 0, 0.35, 1],
          onComplete: () => setIsVisible(false),
        });
      }, REVEAL_AT_MS);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        controls?.stop();
      };
    } else {
      document.documentElement.classList.remove("splash-pending");
    }
  }, [radius]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          id="splash-root"
          style={{ WebkitMaskImage: mask, maskImage: mask }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FBF3EC] pointer-events-none select-none"
        >
          {/* Main Visual Animation Box */}
          <div className="relative w-64 h-52 flex items-center justify-center">
            {/* Ambient warmth glow — blooms as the bird settles */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: [0.7, 1.0, 1.3, 1.15],
                opacity: [0, 0.18, 0.4, 0.22],
              }}
              transition={{
                duration: LANDING_AT + 0.4,
                times: [0, 0.4, 0.88, 1],
                ease: "easeOut",
              }}
              className="absolute w-44 h-44 rounded-full bg-[#E2775B]/25 blur-2xl"
            />

            <svg
              viewBox="0 0 240 180"
              className="w-64 h-52 overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="birdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2775B" />
                  <stop offset="100%" stopColor="#C85F45" />
                </linearGradient>
                <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2775B" />
                  <stop offset="70%" stopColor="#C85F45" />
                  <stop offset="100%" stopColor="#A64B32" />
                </linearGradient>
                <radialGradient id="nestBed" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FBE3DA" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#F5E6C6" stopOpacity="0.6" />
                </radialGradient>
                <clipPath id="nestBowlClip">
                  <path d={BOWL} />
                </clipPath>
              </defs>

              {/* Soft ground shadow — tightens as the bird comes in */}
              <motion.ellipse
                cx="120"
                cy="150"
                rx="62"
                ry="9"
                fill="#EBDFD3"
                initial={{ opacity: 0, scaleX: 0.85 }}
                animate={{ opacity: [0, 0.8, 0.8, 0.95], scaleX: [0.85, 1, 1, 1.04] }}
                transition={{
                  duration: LANDING_AT + 0.3,
                  times: [0, 0.3, 0.8, 1],
                  ease: "easeOut",
                }}
                style={{ originX: "120px", originY: "150px" }}
              />

              {/* Touchdown ripple */}
              <motion.ellipse
                cx="120"
                cy="128"
                rx="34"
                ry="9"
                stroke="#E2775B"
                strokeWidth="1.5"
                fill="none"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 2], opacity: [0, 0.6, 0] }}
                transition={{
                  delay: LANDING_AT - 0.05,
                  duration: 0.9,
                  ease: "easeOut",
                }}
                style={{ originX: "120px", originY: "128px" }}
              />

              {/* Nest — back layer (inner rim + soft lining), sits behind the bird */}
              <motion.g {...nestEntrance}>
                <motion.g {...nestGive}>
                  <ellipse cx="120" cy="121" rx="70" ry="13" fill="#A97B22" opacity="0.95" />
                  <ellipse cx="120" cy="122" rx="60" ry="10" fill="url(#nestBed)" />
                  <path
                    d="M50 121 C60 106 180 106 190 121"
                    stroke="#D4A338"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M55 119 C72 110 168 110 185 119"
                    stroke="#A97B22"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Gentle side greenery */}
                  <path d="M52 130 C42 124 35 128 32 135 C40 137 48 135 52 130Z" fill="#6E8261" />
                  <path d="M42 126 C36 121 31 123 29 128 C34 130 39 129 42 126Z" fill="#566A4B" />
                  <path d="M188 130 C198 124 205 128 208 135 C200 137 192 135 188 130Z" fill="#6E8261" />
                  <path d="M198 126 C204 121 209 123 211 128 C206 130 201 129 198 126Z" fill="#566A4B" />
                </motion.g>
              </motion.g>

              {/* The chicks, waiting in the nest */}
              <motion.g {...nestEntrance}>
                <motion.g {...nestGive}>
                  <Chick x={62} y={113} size={0.8} delay={0.15} />
                  <Chick x={81} y={110} size={0.95} delay={0} />
                  <Chick x={168} y={110} size={1} flip delay={0.08} />
                </motion.g>
              </motion.g>

              {/* The Returning Bird */}
              <motion.g
                initial={{
                  x: flight[0].x,
                  y: flight[0].y,
                  rotate: flight[0].rotate,
                  scale: flight[0].scale,
                  opacity: 0,
                }}
                animate={{
                  x: pick("x"),
                  y: pick("y"),
                  rotate: pick("rotate"),
                  scale: pick("scale"),
                  opacity: 1,
                }}
                transition={{
                  x: { duration: FLIGHT_DURATION, delay: FLIGHT_DELAY, times, ease: "linear" },
                  y: { duration: FLIGHT_DURATION, delay: FLIGHT_DELAY, times, ease: "linear" },
                  rotate: { duration: FLIGHT_DURATION, delay: FLIGHT_DELAY, times, ease: "linear" },
                  scale: { duration: FLIGHT_DURATION, delay: FLIGHT_DELAY, times, ease: "linear" },
                  opacity: { duration: 0.5, delay: FLIGHT_DELAY, ease: "easeOut" },
                }}
                style={{ originX: "127px", originY: "108px" }}
              >
                <g transform="translate(100, 72)">
                  {/* Wing-beat bob */}
                  <motion.g
                    animate={{ y: pick("bob") }}
                    transition={{
                      duration: FLIGHT_DURATION,
                      delay: FLIGHT_DELAY,
                      times,
                      ease: "linear",
                    }}
                  >
                    {/* Resting breath once seated */}
                    <motion.g
                      animate={{ scaleY: [1, 1.025, 1] }}
                      transition={{
                        delay: LANDING_AT + 0.3,
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ originX: "26px", originY: "44px" }}
                    >
                      {/* Back wing */}
                      <motion.g
                        animate={{ rotate: pick("wingBack") }}
                        transition={{
                          duration: FLIGHT_DURATION,
                          delay: FLIGHT_DELAY,
                          times,
                          ease: "linear",
                        }}
                        style={{ originX: "14px", originY: "18px" }}
                      >
                        <path d="M12 18 C16 4 32 -6 40 -2 C34 9 24 18 12 18Z" fill="#C85F45" />
                        <path
                          d="M18 16 C23 6 34 -1 38 1 C32 10 25 17 18 16Z"
                          fill="#A64B32"
                          opacity="0.75"
                        />
                      </motion.g>

                      {/* Split tail */}
                      <motion.g
                        animate={{ rotate: pick("tail") }}
                        transition={{
                          duration: FLIGHT_DURATION,
                          delay: FLIGHT_DELAY,
                          times,
                          ease: "linear",
                        }}
                        style={{ originX: "8px", originY: "32px" }}
                      >
                        <path
                          d="M4 30 C-6 36 -12 45 -9 48 C-3 44 4 37 8 32 Z"
                          fill="#C85F45"
                        />
                        <path
                          d="M8 32 C1 39 -3 47 0 50 C4 46 9 39 12 33 Z"
                          fill="#A64B32"
                        />
                      </motion.g>

                      {/* Torso */}
                      <path
                        d="M10 20 C14 12 24 10 35 15 C43 19 48 28 42 36 C36 43 20 44 12 35 C8 30 8 24 10 20Z"
                        fill="url(#birdGrad)"
                      />

                      {/* Peach breast */}
                      <path
                        d="M26 23 C33 21 39 25 40 31 C36 36 28 34 24 28 C22 25 24 23 26 23Z"
                        fill="#FBE3DA"
                        opacity="0.85"
                      />

                      {/* Head & eye — a small settling nod on landing */}
                      <motion.g
                        animate={{ rotate: [0, 0, 5, -2, 0] }}
                        transition={{
                          delay: LANDING_AT - 0.15,
                          duration: 0.9,
                          times: [0, 0.05, 0.4, 0.7, 1],
                          ease: "easeInOut",
                        }}
                        style={{ originX: "34px", originY: "26px" }}
                      >
                        <circle cx="38" cy="18" r="9" fill="#E2775B" />
                        <circle cx="40" cy="17" r="1.8" fill="#332C26" />
                        <circle cx="40.5" cy="16.5" r="0.6" fill="#FFFFFF" />
                        <path d="M46 17 L55 20 L46 22 Z" fill="#C4922E" />
                      </motion.g>

                      {/* Front wing */}
                      <motion.g
                        animate={{ rotate: pick("wingFront") }}
                        transition={{
                          duration: FLIGHT_DURATION,
                          delay: FLIGHT_DELAY,
                          times,
                          ease: "linear",
                        }}
                        style={{ originX: "20px", originY: "24px" }}
                      >
                        <path
                          d="M18 24 C26 8 42 6 48 13 C40 24 30 31 18 24Z"
                          fill="url(#wingGrad)"
                        />
                        <path
                          d="M24 23 C30 13 41 12 45 17 C38 24 31 29 24 23Z"
                          fill="#E2775B"
                          opacity="0.9"
                        />
                      </motion.g>
                    </motion.g>
                  </motion.g>
                </g>
              </motion.g>

              {/* Nest — front layer (woven bowl) overlaps the bird so it sits *in* the nest */}
              <motion.g {...nestEntrance}>
                <motion.g {...nestGive}>
                  <path d={BOWL} fill="#C4922E" />
                  <g clipPath="url(#nestBowlClip)">
                    {weave.map((w, i) => (
                      <path
                        key={`w${i}`}
                        d={w.d}
                        stroke={w.color}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        opacity="0.85"
                      />
                    ))}
                    {strands.map((s, i) => (
                      <path
                        key={`s${i}`}
                        d={s.d}
                        stroke={s.color}
                        strokeWidth={s.w}
                        strokeLinecap="round"
                      />
                    ))}
                    <path
                      d="M70 140 C92 150 148 150 170 140"
                      stroke="#E2775B"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                  </g>
                  {/* Front rim */}
                  <path
                    d="M51 122 C75 134 165 134 189 122"
                    stroke="#D4A338"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M54 124 C78 135 162 135 186 124"
                    stroke="#A97B22"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  {strayTwigs.map((d, i) => (
                    <path
                      key={`t${i}`}
                      d={d}
                      stroke={i % 2 ? "#A97B22" : "#C4922E"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  ))}
                </motion.g>
              </motion.g>
            </svg>
          </div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mt-3"
          >
            <span className="block font-serif text-3xl font-bold tracking-tight text-[#332C26]">
              {siteConfig.brand.name}
            </span>
            <span className="block font-sans text-xs font-semibold uppercase tracking-widest text-[#6E8261] mt-1.5">
              {siteConfig.brand.tagline}
            </span>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="text-xs text-[#6E6259] font-serif italic mt-2"
            >
              {siteConfig.brand.motto}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
