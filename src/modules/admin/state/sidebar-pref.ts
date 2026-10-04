export const SIDEBAR_STORAGE_KEY = "nn-admin-sidebar";

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "expanded";
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    // Storage blocked: the choice still applies for this page view via the data attribute.
  }
}

// Pre-paint: the sidebar width and labels are driven by `html[data-sidebar]` in CSS, so a reload never
// flashes the expanded sidebar before collapsing. Dependency-free; it is serialised into an inline script.
export const sidebarInitScript = `(function(){try{document.documentElement.dataset.sidebar=localStorage.getItem(${JSON.stringify(
  SIDEBAR_STORAGE_KEY,
)})==="collapsed"?"collapsed":"expanded"}catch(_){}})()`;
