(function () {
  "use strict";

  const KEYWORDS = globalThis.JSC_KEYWORDS;
  const NEUTRAL_HINTS = KEYWORDS.compileHints(KEYWORDS.neutralHints);

  function escape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function getPageText() {
    const selectors = [
      ".jobs-description", ".jobsearch-JobComponent-description",
      ".jobDescriptionContent", '[data-testid="job-description"]',
      '[class*="description"]', '[class*="job-detail"]', '[class*="jobDetail"]',
      "article", "main",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.length > 200) return el.innerText;
    }
    return document.body.innerText;
  }

  function analyze(text, enabledTypes, customKeywords, disabledBuiltins) {
    const PATTERNS = KEYWORDS.compileGroups(KEYWORDS.groups, disabledBuiltins);

    if (!enabledTypes || enabledTypes.length === 0) {
      return { status: "neutral", label: "No Types Enabled", detail: "Enable at least one type in Options.", matches: [] };
    }

    let allRedMatches = [];
    let allGreenMatches = [];

    for (const type of enabledTypes) {
      const builtinRed = PATTERNS[type]?.red || [];
      const builtinGreen = PATTERNS[type]?.green || [];
      const custRed = (customKeywords?.[type]?.red || []).map((p) => new RegExp(escape(p), "i"));
      const custGreen = (customKeywords?.[type]?.green || []).map((p) => new RegExp(escape(p), "i"));

      allRedMatches.push(...[...builtinRed, ...custRed].filter((p) => p.test(text)));
      allGreenMatches.push(...[...builtinGreen, ...custGreen].filter((p) => p.test(text)));
    }

    const neutralMatches = NEUTRAL_HINTS
      .map((p) => {
        const m = text.match(p);
        return m ? m[0] : "";
      })
      .filter(Boolean);
    const hasAnyMention = neutralMatches.length > 0;

    if (allRedMatches.length > 0 && allGreenMatches.length === 0) {
      return {
        status: "red", label: "No Sponsorship",
        detail: "This posting suggests sponsorship is NOT available.",
        matches: allRedMatches.map((p) => { const m = text.match(p); return m ? m[0] : ""; }),
      };
    }
    if (allGreenMatches.length > 0) {
      return {
        status: "green", label: "Sponsorship Available",
        detail: "This posting indicates sponsorship may be offered.",
        matches: allGreenMatches.map((p) => { const m = text.match(p); return m ? m[0] : ""; }),
      };
    }
    if (!hasAnyMention) {
      return {
        status: "green", label: "Not Mentioned",
        detail: "Sponsorship is not mentioned — often means it may be available or negotiable.",
        matches: [],
      };
    }
    return {
      status: "yellow",
      label: "Unclear",
      detail: "Sponsorship is mentioned but intent is ambiguous.",
      matches: neutralMatches,
    };
  }

  function buildBadge(result) {
    const colors = {
      green:   { bg: "#16a34a", border: "#15803d", text: "#fff", glow: "rgba(22,163,74,0.35)" },
      red:     { bg: "#dc2626", border: "#b91c1c", text: "#fff", glow: "rgba(220,38,38,0.35)" },
      yellow:  { bg: "#d97706", border: "#b45309", text: "#fff", glow: "rgba(217,119,6,0.35)" },
      neutral: { bg: "#475569", border: "#334155", text: "#fff", glow: "rgba(71,85,105,0.35)" },
    };
    const c = colors[result.status] || colors.neutral;
    const badge = document.createElement("div");
    badge.id = "jsc-badge";
    badge.style.cssText = `position:fixed;top:80px;right:20px;z-index:2147483647;
      background:${c.bg};border:2px solid ${c.border};border-radius:12px;
      padding:12px 16px;min-width:200px;max-width:280px;
      box-shadow:0 4px 24px ${c.glow},0 2px 8px rgba(0,0,0,0.25);
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      color:${c.text};cursor:pointer;transition:opacity 0.3s,transform 0.3s;user-select:none;`;
    const dot = document.createElement("div");
    dot.style.cssText = `display:inline-block;width:12px;height:12px;border-radius:50%;
      background:${c.text};opacity:0.9;margin-right:8px;vertical-align:middle;box-shadow:0 0 6px ${c.text};`;
    const titleEl = document.createElement("span");
    titleEl.style.cssText = "font-size:14px;font-weight:700;vertical-align:middle;";
    titleEl.textContent = result.label;
    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;margin-bottom:6px;";
    header.appendChild(dot); header.appendChild(titleEl);
    const detail = document.createElement("div");
    detail.style.cssText = "font-size:11px;opacity:0.88;line-height:1.4;";
    detail.textContent = result.detail;
    badge.appendChild(header); badge.appendChild(detail);
    if (result.matches && result.matches.length > 0) {
      const snippet = document.createElement("div");
      snippet.style.cssText = `margin-top:8px;font-size:10px;opacity:0.75;font-style:italic;
        border-top:1px solid rgba(255,255,255,0.25);padding-top:6px;line-height:1.4;`;
      const unique = [...new Set(result.matches.slice(0, 3))];
      snippet.textContent = "Detected: " + unique.map((m) => `"${m.trim()}"`).join(", ");
      badge.appendChild(snippet);
    }
    const closeBtn = document.createElement("div");
    closeBtn.style.cssText = "position:absolute;top:6px;right:10px;font-size:14px;opacity:0.6;line-height:1;cursor:pointer;";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      badge.style.opacity = "0"; badge.style.transform = "translateX(30px)";
      setTimeout(() => badge.remove(), 300);
    });
    badge.appendChild(closeBtn);
    badge.addEventListener("click", () => {
      badge.style.opacity = "0"; badge.style.transform = "translateX(30px)";
      setTimeout(() => badge.remove(), 300);
    });
    setTimeout(() => {
      badge.style.opacity = "0"; badge.style.transform = "translateX(30px)";
      setTimeout(() => badge.remove(), 300);
    }, 5000);
    return badge;
  }

  const DEFAULT_ENABLED = KEYWORDS.defaultEnabled;
  const DEFAULT_CUSTOM = KEYWORDS.defaultCustom;
  const DEFAULT_DISABLED_BUILTINS = KEYWORDS.defaultDisabledBuiltins;

  function run(enabledTypes, customKeywords, disabledBuiltins) {
    const existing = document.getElementById("jsc-badge");
    if (existing) existing.remove();
    const text = getPageText();
    const result = analyze(text, enabledTypes, customKeywords, disabledBuiltins);
    window._jscResult = result;
    document.body.appendChild(buildBadge(result));
  }

  function init() {
    chrome.storage.sync.get({
      enabledTypes: DEFAULT_ENABLED,
      customKeywords: DEFAULT_CUSTOM,
      disabledBuiltins: DEFAULT_DISABLED_BUILTINS,
    }, (data) => {
      run(data.enabledTypes, data.customKeywords, data.disabledBuiltins);
    });
  }

  function getJobId() {
    return new URLSearchParams(location.search).get("currentJobId") || location.href;
  }

  let lastJobId = null;
  let scanTimer = null;

  function scheduleScan(delay) {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      const jobId = getJobId();
      if (jobId !== lastJobId) {
        lastJobId = jobId;
        init();
      }
    }, delay);
  }

  const origPushState = history.pushState.bind(history);
  history.pushState = function (...args) { origPushState(...args); scheduleScan(2000); };

  const origReplaceState = history.replaceState.bind(history);
  history.replaceState = function (...args) { origReplaceState(...args); scheduleScan(2000); };

  window.addEventListener("popstate", () => scheduleScan(2000));

  const observer = new MutationObserver(() => {
    const jobId = getJobId();
    if (jobId !== lastJobId) scheduleScan(2000);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { lastJobId = getJobId(); setTimeout(init, 1200); });
  } else {
    lastJobId = getJobId();
    setTimeout(init, 1200);
  }
})();
