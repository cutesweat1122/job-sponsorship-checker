(function (global) {
  "use strict";

  const GROUPS = {
    general: {
      red: [
        { label: "no sponsorship / no visa sponsorship", pattern: "\\bno\\s+(?:visa\\s+)?sponsorship\\b" },
        { label: "without [wildcard] sponsorship", pattern: "\\bwithout\\s+(?:[\\w-]+\\s+){0,6}sponsorship\\b" },
        { label: "will not sponsor", pattern: "\\bwill\\s+not\\s+(?:provide\\s+)?sponsor" },
        { label: "cannot sponsor", pattern: "\\bcannot\\s+(?:provide\\s+)?sponsor" },
        { label: "not able / not eligible to sponsor", pattern: "\\bnot\\s+(?:able|eligible)\\s+to\\s+sponsor" },
        { label: "do not offer / provide sponsorship", pattern: "\\bdo\\s+not\\s+(?:offer|provide)\\s+sponsor" },
        { label: "unable to provide sponsorship", pattern: "\\bunable\\s+to\\s+(?:provide\\s+)?sponsor" },
        { label: "sponsorship not available / offered / provided", pattern: "\\bsponsorship\\s+(?:is\\s+)?not\\s+(?:available|offered|provided)" },
        { label: "not currently offering sponsorship", pattern: "\\bnot\\s+(?:currently\\s+)?(?:offering|providing)\\s+(?:work\\s+)?sponsor" },
        { label: "not offer work sponsorship", pattern: "\\bnot\\s+offer\\s+(?:work\\s+)?sponsor" },
        { label: "non-sponsored", pattern: "\\bnon-sponsored\\b" },
        { label: "we do not sponsor", pattern: "\\bwe\\s+do\\s+not\\s+sponsor\\b" },
        { label: "not eligible for (employment) (visa) sponsorship", pattern: "\\bnot\\s+eligible\\s+for\\s+(?:employment\\s+)?(?:visa\\s+)?sponsor" },
        { label: "must be legally (authorized) to work permanently", pattern: "\\bmust\\s+be\\s+legally\\s+(?:authorized\\s+)?to\\s+work\\s+permanently\\b" },
        { label: "not offer work authorization", pattern: "\\bnot\\s+offer\\s+work\\s+authorization\\b" },
        { label: "no visa / no work visa", pattern: "\\bno\\s+(?:work\\s+)?visa\\b" },
        { label: "U.S./US citizenship (any mention)", pattern: "\\bu\\.?s\\.?\\s+citizenship\\b" },
        { label: "U.S./US citizen (any mention)", pattern: "\\bu\\.?s\\.?\\s+citizen\\b" },
        { label: "U.S./US person (any mention)", pattern: "\\bu\\.?s\\.?\\s+person\\b" },
        { label: "clearance (any mention)", pattern: "\\bclearance\\b" },
        { label: "security clearance", pattern: "\\bsecurity\\s+clearance\\b" },
        { label: "secret clearance", pattern: "\\bsecret\\s+clearance\\b" },
        { label: "top secret", pattern: "\\btop\\s+secret\\b" },
        { label: "TS/SCI", pattern: "\\bts\\/sci\\b" },
        { label: "active (security) clearance", pattern: "\\bactive\\s+(?:security\\s+)?clearance\\b" },
        { label: "clearance required", pattern: "\\bclearance\\s+required\\b" },
        { label: "export control / export controlled", pattern: "\\bexport\\s+control(?:led)?\\b" },
        { label: "ITAR", pattern: "\\bitar\\b" },
        { label: "International Traffic in Arms", pattern: "\\binternational\\s+traffic\\s+in\\s+arms\\b" },
        { label: "deemed export", pattern: "\\bdeemed\\s+export\\b" },
        { label: "export license required", pattern: "\\bexport\\s+licen[sc]e\\s+(?:is\\s+)?required\\b" },
        { label: "EAR controlled / compliance / restriction", pattern: "\\bear\\s+(?:99\\s+)?(?:controlled|compliance|restriction)" },
      ],
      green: [
        { label: "will provide / offer / consider sponsorship / visa sponsorship / work visa sponsorship / work visa", pattern: "\\bwill\\s+(?:provide|offer|consider)\\s+(?:(?:(?:work\\s+)?visa\\s+)?sponsorship|work\\s+visa)\\b" },
      ],
    },
    h1b: {
      red: [
        { label: "no H-1B", pattern: "\\bno\\s+h[\\s-]?1[\\s-]?b\\b" },
        { label: "will not sponsor / support H-1B", pattern: "\\bwill\\s+not\\s+(?:sponsor|support)\\s+h[\\s-]?1[\\s-]?b\\b" },
        { label: "H-1B not sponsored / accepted / available / eligible", pattern: "\\bh[\\s-]?1[\\s-]?b\\s+(?:not\\s+)?(?:sponsored|accepted|available|eligible)\\b" },
        { label: "cannot sponsor H-1B", pattern: "\\bcannot\\s+sponsor\\s+h[\\s-]?1[\\s-]?b\\b" },
        { label: "no H-1B sponsorship / transfer / cap", pattern: "\\bno\\s+h[\\s-]?1[\\s-]?b\\s+(?:sponsorship|transfer|cap)\\b" },
      ],
      green: [
        { label: "will sponsor H-1B", pattern: "\\bwill\\s+sponsor\\s+h[\\s-]?1[\\s-]?b\\b" },
      ],
    },
    opt: {
      red: [
        { label: "no OPT", pattern: "\\bno\\s+opt\\b" },
        { label: "OPT not accepted / eligible / available / sponsored", pattern: "\\bopt\\s+not\\s+(?:accepted|eligible|available|sponsored)\\b" },
        { label: "will not hire / accept on OPT", pattern: "\\bwill\\s+not\\s+(?:hire|accept|support)\\s+(?:on\\s+)?opt\\b" },
        { label: "do not hire / accept on OPT", pattern: "\\bdo\\s+not\\s+(?:hire|accept)\\s+(?:on\\s+)?opt\\b" },
      ],
      green: [
        { label: "will sponsor OPT", pattern: "\\bwill\\s+sponsor\\s+opt\\b" },
        { label: "hire on OPT", pattern: "\\bhire\\s+on\\s+opt\\b" },
      ],
    },
    cpt: {
      red: [
        { label: "no CPT", pattern: "\\bno\\s+cpt\\b" },
        { label: "CPT not accepted / eligible / available", pattern: "\\bcpt\\s+not\\s+(?:accepted|eligible|available)\\b" },
        { label: "will not hire / accept on CPT", pattern: "\\bwill\\s+not\\s+(?:hire|accept|support)\\s+(?:on\\s+)?cpt\\b" },
        { label: "do not hire / accept on CPT", pattern: "\\bdo\\s+not\\s+(?:hire|accept)\\s+(?:on\\s+)?cpt\\b" },
      ],
      green: [
        { label: "will sponsor CPT", pattern: "\\bwill\\s+sponsor\\s+cpt\\b" },
        { label: "hire on CPT", pattern: "\\bhire\\s+on\\s+cpt\\b" },
      ],
    },
  };

  const NEUTRAL_HINTS = [
    "\\bsponsor(?:ship)?\\b",
    "\\bvisa\\b",
    "\\bwork\\s+authorization\\b",
    "\\bh[\\s-]?1[\\s-]?b\\b",
    "\\bgreen\\s+card\\b",
    "\\bcitizenship\\b",
    "\\bclearance\\b",
    "\\bopt\\b",
    "\\bcpt\\b",
  ];

  const DEFAULT_ENABLED = ["general", "h1b", "opt", "cpt"];
  const DEFAULT_CUSTOM = {
    general: { red: [], green: [] },
    h1b: { red: [], green: [] },
    opt: { red: [], green: [] },
    cpt: { red: [], green: [] },
  };
  const DEFAULT_DISABLED_BUILTINS = {
    general: { red: [], green: [] },
    h1b: { red: [], green: [] },
    opt: { red: [], green: [] },
    cpt: { red: [], green: [] },
  };

  function compilePattern(entry) {
    return new RegExp(entry.pattern, entry.flags || "i");
  }

  function compileGroups(groups, disabledBuiltins = {}) {
    return Object.fromEntries(Object.entries(groups).map(([type, colors]) => [
      type,
      {
        red: colors.red
          .filter((entry) => !(disabledBuiltins[type]?.red || []).includes(entry.label))
          .map(compilePattern),
        green: colors.green
          .filter((entry) => !(disabledBuiltins[type]?.green || []).includes(entry.label))
          .map(compilePattern),
      },
    ]));
  }

  function labelsFor(groups) {
    return Object.fromEntries(Object.entries(groups).map(([type, colors]) => [
      type,
      {
        red: colors.red.map((entry) => entry.label),
        green: colors.green.map((entry) => entry.label),
      },
    ]));
  }

  global.JSC_KEYWORDS = {
    groups: GROUPS,
    neutralHints: NEUTRAL_HINTS,
    defaultEnabled: DEFAULT_ENABLED,
    defaultCustom: DEFAULT_CUSTOM,
    defaultDisabledBuiltins: DEFAULT_DISABLED_BUILTINS,
    compileGroups,
    compileHints: (hints) => hints.map((pattern) => new RegExp(pattern, "i")),
    labelsFor,
  };
})(globalThis);
