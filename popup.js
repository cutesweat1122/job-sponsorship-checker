const KEYWORDS = globalThis.JSC_KEYWORDS;
const DEFAULT_ENABLED = KEYWORDS.defaultEnabled;
const DEFAULT_CUSTOM = KEYWORDS.defaultCustom;
const DEFAULT_DISABLED_BUILTINS = KEYWORDS.defaultDisabledBuiltins;
const BUILTIN_LABELS = KEYWORDS.labelsFor(KEYWORDS.groups);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function analyzeAndInject(enabledTypes, customKeywords, disabledBuiltins) {
  const keywords = globalThis.JSC_KEYWORDS;
  const PATTERNS = keywords.compileGroups(keywords.groups, disabledBuiltins);
  const NEUTRAL_HINTS = keywords.compileHints(keywords.neutralHints);

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

  function analyze(text) {
    if (!enabledTypes || enabledTypes.length === 0) {
      return { status: "neutral", label: "No Types Enabled", detail: "Enable at least one type in Options.", matches: [] };
    }

    let allRedMatches = [];
    let allGreenMatches = [];

    for (const type of enabledTypes) {
      const builtinRed   = PATTERNS[type]?.red   || [];
      const builtinGreen = PATTERNS[type]?.green  || [];
      const custRed   = (customKeywords?.[type]?.red   || []).map((p) => new RegExp(escape(p), "i"));
      const custGreen = (customKeywords?.[type]?.green || []).map((p) => new RegExp(escape(p), "i"));

      allRedMatches.push(...[...builtinRed,   ...custRed  ].filter((p) => p.test(text)));
      allGreenMatches.push(...[...builtinGreen, ...custGreen].filter((p) => p.test(text)));
    }

    const hasAnyMention = NEUTRAL_HINTS.some((p) => p.test(text));

    if (allRedMatches.length > 0 && allGreenMatches.length === 0) {
      return { status: "red", label: "No Sponsorship", detail: "This posting suggests sponsorship is NOT available.",
        matches: allRedMatches.map((p) => { const m = text.match(p); return m ? m[0] : ""; }) };
    }
    if (allGreenMatches.length > 0) {
      return { status: "green", label: "Sponsorship Available", detail: "This posting indicates sponsorship may be offered.",
        matches: allGreenMatches.map((p) => { const m = text.match(p); return m ? m[0] : ""; }) };
    }
    if (!hasAnyMention) {
      return { status: "green", label: "Not Mentioned", detail: "Sponsorship is not mentioned — often means it may be available or negotiable.", matches: [] };
    }
    return { status: "yellow", label: "Unclear", detail: "Sponsorship is mentioned but intent is ambiguous.", matches: [] };
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

  const existing = document.getElementById("jsc-badge");
  if (existing) existing.remove();
  const text = getPageText();
  const result = analyze(text);
  window._jscResult = result;
  document.body.appendChild(buildBadge(result));
  return result;
}

/* ── Popup UI ── */

let currentKwCat = "general";

function renderResult(result) {
  const area = document.getElementById("result-area");
  if (!result) {
    area.innerHTML = `
      <div class="not-job-page"><div class="icon">📄</div><div>No result yet for this page.</div></div>
      <button class="scan-btn" id="scan-btn">Scan This Page</button>
    `;
    document.getElementById("scan-btn").addEventListener("click", runScan);
    return;
  }
  const colorMap = { green: "green", red: "red", yellow: "yellow", neutral: "neutral" };
  const card = colorMap[result.status] || "neutral";
  let matchHtml = "";
  if (result.matches && result.matches.length > 0) {
    const unique = [...new Set(result.matches.slice(0, 3))];
    matchHtml = `<div style="margin-top:8px;font-size:10px;color:#64748b;font-style:italic;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;">
      Detected: ${unique.map((m) => `"${escapeHtml(m.trim())}"`).join(", ")}</div>`;
  }
  area.innerHTML = `
    <div class="status-card ${card}">
      <div class="status-row"><div class="dot ${card}"></div><div class="status-label">${escapeHtml(result.label)}</div></div>
      <div class="status-detail">${escapeHtml(result.detail)}</div>${matchHtml}
    </div>
    <button class="rescan-btn" id="rescan-btn">Re-scan this page</button>
  `;
  document.getElementById("rescan-btn").addEventListener("click", runScan);
}

function runScan() {
  const btn = document.getElementById("scan-btn") || document.getElementById("rescan-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Scanning…"; }

  chrome.storage.sync.get({
    enabledTypes: DEFAULT_ENABLED,
    customKeywords: DEFAULT_CUSTOM,
    disabledBuiltins: DEFAULT_DISABLED_BUILTINS,
  }, (data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) { renderResult(null); return; }
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ["keywords.js"] },
        () => {
          if (chrome.runtime.lastError) { renderResult(null); return; }
          chrome.scripting.executeScript(
            { target: { tabId: tab.id }, func: analyzeAndInject, args: [data.enabledTypes, data.customKeywords, data.disabledBuiltins] },
            (results) => {
              if (chrome.runtime.lastError) { renderResult(null); return; }
              const result = results && results[0] && results[0].result ? results[0].result : null;
              renderResult(result);
            }
          );
        }
      );
    });
  });
}

/* ── Options ── */

function loadToggles() {
  chrome.storage.sync.get({ enabledTypes: DEFAULT_ENABLED }, (data) => {
    ["general", "h1b", "opt", "cpt"].forEach((type) => {
      const el = document.getElementById(`toggle-${type}`);
      if (el) el.checked = data.enabledTypes.includes(type);
    });
  });
}

function saveToggles() {
  const enabled = ["general", "h1b", "opt", "cpt"].filter((t) => document.getElementById(`toggle-${t}`)?.checked);
  chrome.storage.sync.set({ enabledTypes: enabled });
}

/* ── Keywords ── */

function renderBuiltinToggle(type, color, builtins, disabledBuiltins) {
  const id = `builtin-${color}`;
  const disabled = disabledBuiltins[type]?.[color] || [];
  const visibleBuiltins = builtins.filter((label) => !disabled.includes(label));
  const count = visibleBuiltins.length;
  const total = builtins.length;
  const countText = count === total ? `${count}` : `${count}/${total}`;
  const tags = visibleBuiltins.map((label) => `
    <span class="kw-tag kw-builtin">${escapeHtml(label)}
      <button class="kw-tag-del kw-builtin-del" data-type="${type}" data-color="${color}" data-label="${escapeHtml(label)}" title="Remove built-in keyword">×</button>
    </span>`).join("") || `<span class="kw-empty">No active built-in phrases.</span>`;
  const resetHtml = disabled.length > 0
    ? `<button class="kw-builtin-reset" data-type="${type}" data-color="${color}" title="Restore removed built-ins">Restore defaults</button>`
    : "";
  return `
    <div class="kw-builtin-row">
      <button class="kw-builtin-toggle" data-target="${id}">
        Built-in (${countText}) <span class="kw-builtin-arrow" id="${id}-arrow">▶</span>
      </button>
      ${resetHtml}
    </div>
    <div class="kw-builtin-list" id="${id}" style="display:none;">${tags}</div>
  `;
}

function renderKwList(type, color, builtins, phrases, disabledBuiltins) {
  const listEl = document.getElementById(`${color}-list`);
  if (!listEl) return;

  const builtinHtml = renderBuiltinToggle(type, color, builtins, disabledBuiltins);
  const customHtml = phrases.length === 0
    ? `<span class="kw-empty">No custom phrases yet.</span>`
    : phrases.map((phrase, i) => `
        <span class="kw-tag">${escapeHtml(phrase)}
          <button class="kw-tag-del kw-custom-del" data-type="${type}" data-color="${color}" data-index="${i}" title="Remove">×</button>
        </span>`).join("");

  listEl.innerHTML = builtinHtml + `<div class="kw-custom-list">${customHtml}</div>`;

  listEl.querySelectorAll(".kw-builtin-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      const arrow = document.getElementById(`${btn.dataset.target}-arrow`);
      if (!target) return;
      const open = target.style.display === "none";
      target.style.display = open ? "block" : "none";
      if (arrow) arrow.textContent = open ? "▼" : "▶";
    });
  });

  listEl.querySelectorAll(".kw-custom-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type, col = btn.dataset.color;
      const idx = parseInt(btn.dataset.index, 10);
      chrome.storage.sync.get({ customKeywords: DEFAULT_CUSTOM }, (data) => {
        const kw = data.customKeywords;
        if (!kw[t]) kw[t] = { red: [], green: [] };
        kw[t][col].splice(idx, 1);
        chrome.storage.sync.set({ customKeywords: kw }, () => loadKeywords(t));
      });
    });
  });

  listEl.querySelectorAll(".kw-builtin-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type, col = btn.dataset.color, label = btn.dataset.label;
      chrome.storage.sync.get({ disabledBuiltins: DEFAULT_DISABLED_BUILTINS }, (data) => {
        const disabled = data.disabledBuiltins;
        if (!disabled[t]) disabled[t] = { red: [], green: [] };
        if (!disabled[t][col]) disabled[t][col] = [];
        if (!disabled[t][col].includes(label)) disabled[t][col].push(label);
        chrome.storage.sync.set({ disabledBuiltins: disabled }, () => loadKeywords(t));
      });
    });
  });

  listEl.querySelectorAll(".kw-builtin-reset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type, col = btn.dataset.color;
      chrome.storage.sync.get({ disabledBuiltins: DEFAULT_DISABLED_BUILTINS }, (data) => {
        const disabled = data.disabledBuiltins;
        if (!disabled[t]) disabled[t] = { red: [], green: [] };
        disabled[t][col] = [];
        chrome.storage.sync.set({ disabledBuiltins: disabled }, () => loadKeywords(t));
      });
    });
  });
}

function loadKeywords(cat) {
  const type = cat || currentKwCat;
  const builtinRed   = BUILTIN_LABELS[type]?.red   || [];
  const builtinGreen = BUILTIN_LABELS[type]?.green || [];
  chrome.storage.sync.get({
    customKeywords: DEFAULT_CUSTOM,
    disabledBuiltins: DEFAULT_DISABLED_BUILTINS,
  }, (data) => {
    const kw = data.customKeywords[type] || { red: [], green: [] };
    renderKwList(type, "red",   builtinRed,   kw.red   || [], data.disabledBuiltins);
    renderKwList(type, "green", builtinGreen, kw.green || [], data.disabledBuiltins);
  });
}

function normalizeKeyword(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function findBuiltinKeyword(type, phrase) {
  const normalized = normalizeKeyword(phrase);
  for (const color of ["red", "green"]) {
    const label = (BUILTIN_LABELS[type]?.[color] || []).find((entry) => normalizeKeyword(entry) === normalized);
    if (label) return { color, label };
  }
  return null;
}

function showKeywordMessage(color, message, tone = "info") {
  const messageEl = document.getElementById(`${color}-message`);
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `kw-message ${tone}`;
}

function clearKeywordMessages() {
  ["red", "green"].forEach((color) => {
    const messageEl = document.getElementById(`${color}-message`);
    if (!messageEl) return;
    messageEl.textContent = "";
    messageEl.className = "kw-message";
  });
}

function addKeyword(color) {
  const input = document.getElementById(`${color}-input`);
  const phrase = input.value.trim();
  if (!phrase) return;
  const type = currentKwCat;
  clearKeywordMessages();
  chrome.storage.sync.get({
    customKeywords: DEFAULT_CUSTOM,
    disabledBuiltins: DEFAULT_DISABLED_BUILTINS,
  }, (data) => {
    const builtinMatch = findBuiltinKeyword(type, phrase);
    if (builtinMatch) {
      const disabled = data.disabledBuiltins;
      if (!disabled[type]) disabled[type] = { red: [], green: [] };
      if (!disabled[type][builtinMatch.color]) disabled[type][builtinMatch.color] = [];

      const disabledIndex = disabled[type][builtinMatch.color].indexOf(builtinMatch.label);
      if (disabledIndex !== -1) {
        disabled[type][builtinMatch.color].splice(disabledIndex, 1);
        chrome.storage.sync.set({ disabledBuiltins: disabled }, () => {
          input.value = "";
          loadKeywords(type);
          showKeywordMessage(color, "Default keyword restored and enabled.", "success");
        });
        return;
      }

      const defaultColor = builtinMatch.color === "red" ? "Red" : "Green";
      showKeywordMessage(color, `Already included in ${defaultColor} default keywords.`);
      return;
    }

    const kw = data.customKeywords;
    if (!kw[type]) kw[type] = { red: [], green: [] };
    if (!kw[type][color]) kw[type][color] = [];
    if (!kw[type][color].includes(phrase)) kw[type][color].push(phrase);
    chrome.storage.sync.set({ customKeywords: kw }, () => { input.value = ""; loadKeywords(type); });
  });
}

/* ── Init ── */

document.addEventListener("DOMContentLoaded", () => {
  /* Tab switching */
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  /* Options toggles */
  loadToggles();
  ["general", "h1b", "opt", "cpt"].forEach((type) => {
    document.getElementById(`toggle-${type}`)?.addEventListener("change", saveToggles);
  });

  /* Keyword category tabs */
  document.querySelectorAll(".kw-cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".kw-cat-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentKwCat = btn.dataset.cat;
      clearKeywordMessages();
      loadKeywords(currentKwCat);
    });
  });

  /* Keyword add buttons */
  document.getElementById("red-add").addEventListener("click", () => addKeyword("red"));
  document.getElementById("green-add").addEventListener("click", () => addKeyword("green"));
  document.getElementById("red-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addKeyword("red"); });
  document.getElementById("green-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addKeyword("green"); });

  loadKeywords("general");

  /* Load existing result from page */
  const scanBtn = document.getElementById("scan-btn");
  if (scanBtn) scanBtn.addEventListener("click", runScan);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) { renderResult(null); return; }
    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, func: () => window._jscResult },
      (results) => {
        if (chrome.runtime.lastError) { renderResult(null); return; }
        const result = results && results[0] && results[0].result ? results[0].result : null;
        renderResult(result);
      }
    );
  });
});
