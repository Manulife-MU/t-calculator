const PRODUCT_RATES = {
  "MP (only)": 2,
  "MP + CI": 2,
  "MCP (only)": 1.5,
  "MCP + CI": 1.5,
  "EDU": 1,
  "EDU (Double Benefit)": 1.5,
  "TKKW": 1
};

const ISSUED_DURATION = {
  "Less than 2 yrs": false,
  "More than 2 yrs": true
};

const AGENT_TYPES = ["Normal", "MDRT", "COT", "TOT"];

const AGE_OPTIONS = [0.5, ...Array.from({ length: 62 }, (_, i) => i + 1)];

const THRESHOLD_18_45 = {
  Normal: 100_000_000,
  MDRT: 110_000_000,
  COT: 120_000_000,
  TOT: 120_000_000
};

const THRESHOLD_46_60 = {
  MED3_MAX: 75_000_000,
  MED4_MAX: 420_000_000
};

const THRESHOLD_LT18 = {
  MED2_MIN: 21_000_000
};

const LT18_BELOW_ACTION = "None"; // <-- ASSUMPTION: confirm with underwriting

const TKKW_RULES = {
  "18-45": {
    NO_CHECKUP_MAX: 75_000_000
  },
  "46-62": {
    NO_CHECKUP_MAX: 25_000_000,
    MED3_MAX: 75_000_000,
    MED4_MAX: 420_000_000
  }
};

const ACTION_STYLE = {
  "None": { badge: "bg-success", label: "No medical check up" },
  "MED2": { badge: "bg-info text-dark", label: "MED 2 Required" },
  "MED3": { badge: "bg-warning text-dark", label: "MED 3 Required" },
  "MED4": { badge: "bg-orange text-white", label: "MED 4 Required" },
  "MED5": { badge: "bg-danger", label: "MED 5 Required" },
  "NOT_APPLICABLE": { badge: "bg-secondary", label: "Not Applicable" },
  "UNDEFINED": { badge: "bg-secondary", label: "No Rule Defined" }
};

const FINANCIAL_THRESHOLDS = {
  TIER1_MIN: 100_000_000,
  TIER2_MIN: 200_000_000,
};

const FINANCIAL_REQUIREMENTS = {
  TIER1: ["Financial Questionnaire", "Large Case Report"],
  TIER2: ["Financial Questionnaire", "Large Case Report", "Solid Financial Evidence"],
  DEFAULT: ["-"]
};
