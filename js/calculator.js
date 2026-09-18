/** TSAR for a single application/policy entry. */
function computeTSAR(faceAmount, product) {
  const rate = PRODUCT_RATES[product];
  if (rate === undefined) return 0;
  const amount = Number(faceAmount) || 0;
  if (amount <= 0) return 0;
  return amount * rate;
}

function shouldIncludeInMedicalGrandTSAR(issuedDuration) {
  return ISSUED_DURATION[issuedDuration] === true;
}

function computeMedicalGrandTSAR(currentTSAR, includedConcurrentTSARList) {
  const sum = includedConcurrentTSARList.reduce((s, v) => s + (Number(v) || 0), 0);
  return (Number(currentTSAR) || 0) + sum;
}

function computeFinancialGrandTSAR(currentTSAR, allConcurrentTSARList) {
  const sum = allConcurrentTSARList.reduce((s, v) => s + (Number(v) || 0), 0);
  return (Number(currentTSAR) || 0) + sum;
}

function getAgeBand(age) {
  const a = Number(age);
  if (a < 18) return "<18";
  if (a >= 18 && a <= 45) return "18-45";
  if (a >= 46 && a <= 60) return "46-60";
  return "out of range"; // CONFIRMED: 61-62 stays undefined for every non-TKKW product
}

function getTKKWAgeBand(age) {
  const a = Number(age);
  if (a < 18) return "<18";
  if (a >= 18 && a <= 45) return "18-45";
  if (a >= 46 && a <= 62) return "46-62";
  return "out of range";
}

function determineTKKW(medicalGrandTSAR, age) {
  const band = getTKKWAgeBand(age);
  const tsar = Number(medicalGrandTSAR) || 0;

  if (band === "<18") {
    return {
      action: "NOT_APPLICABLE",
      band,
      rule: `TKKW: LI Age < 18 is Not Applicable — TKKW rules only apply from age 18 onward.`
    };
  }

  if (band === "18-45") {
    const max = TKKW_RULES["18-45"].NO_CHECKUP_MAX;
    if (tsar <= max) {
      return { 
        action: "None", 
        band, 
        rule: `TKKW, Age 18-45: Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(max)} → No Checkup` 
      };
    }
    return { 
      action: "MED4", 
      band, 
      rule: `TKKW, Age 18-45: Medical Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(max)} → MED4` 
    };
  }

  if (band === "46-62") {
    const r = TKKW_RULES["46-62"];
    if (tsar <= r.NO_CHECKUP_MAX) {
      return { 
        action: "None", 
        band, 
        rule: `TKKW, Age 46-62: Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(r.NO_CHECKUP_MAX)} → No Checkup` 
      };
    }
    if (tsar <= r.MED3_MAX) {
      return { 
        action: "MED3", 
        band, 
        rule: `TKKW, Age 46-62: Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(r.MED3_MAX)} → MED3` 
      };
    }
    if (tsar <= r.MED4_MAX) {
      return { 
        action: "MED4", 
        band, 
        rule: `TKKW, Age 46-62: Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(r.MED4_MAX)} → MED4` 
      };
    }
    return { 
      action: "MED5", 
      band, 
      rule: `TKKW, Age 46-62: Medical Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(r.MED4_MAX)} → MED5` 
    };
  }

  return { 
    action: "UNDEFINED", 
    band, 
    rule: `No TKKW rule is defined for LI Age ${age}.` 
  };
}

function determineMED(medicalGrandTSAR, agentType, age, currentProduct) {
  if (currentProduct === "TKKW") {
    return determineTKKW(medicalGrandTSAR, age);
  }

  const band = getAgeBand(age);
  const tsar = Number(medicalGrandTSAR) || 0;

  if (band === "<18") {
    if (tsar > THRESHOLD_LT18.MED2_MIN) {
      return { 
        action: "MED2", 
        band, 
        rule: `Age < 18: Medical Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(THRESHOLD_LT18.MED2_MIN)} → MED2` 
      };
    }
    return { 
      action: "None", 
      band, 
      rule: `Age < 18: Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(THRESHOLD_LT18.MED2_MIN)} → None` 
    };
  }

  if (band === "18-45") {
    const threshold = THRESHOLD_18_45[agentType];
    if (tsar <= threshold) {
      return { 
        action: "None", 
        band, 
        rule: `Age 18-45, ${agentType}: Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(threshold)} → None` 
      };
    }
    return { 
      action: "MED4", 
      band, 
      rule: `Age 18-45, ${agentType}: Medical Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(threshold)} → MED4` 
    };
  }

  if (band === "46-60") {
    if (tsar <= THRESHOLD_46_60.MED3_MAX) {
      return { 
        action: "MED3", 
        band, 
        rule: `Age 46-60: Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(THRESHOLD_46_60.MED3_MAX)} → MED3` 
      };
    }
    if (tsar <= THRESHOLD_46_60.MED4_MAX) {
      return { 
        action: "MED4", 
        band, 
        rule: `Age 46-60: ${formatMMK(THRESHOLD_46_60.MED3_MAX)} < Medical Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(THRESHOLD_46_60.MED4_MAX)} → MED4` 
      };
    }
    return { 
      action: "MED5", 
      band, 
      rule: `Age 46-60: Medical Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(THRESHOLD_46_60.MED4_MAX)} → MED5` 
    };
  }

  return { 
    action: "UNDEFINED", 
    band, 
    rule: `No rule is defined for age band ${band} (age=${age}) and agent type ${agentType}.` 
  };
}

function determineFinancial(financialGrandTSAR) {
  const tsar = Number(financialGrandTSAR) || 0;

  if (tsar > FINANCIAL_THRESHOLDS.TIER2_MIN) {
    return {
      tier: "TIER2",
      items: FINANCIAL_REQUIREMENTS.TIER2,
      rule: `Financial Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(FINANCIAL_THRESHOLDS.TIER2_MIN)} → Financial Questionnaire + Large Case Report`
    };
  }
  if (tsar > FINANCIAL_THRESHOLDS.TIER1_MIN) {
    return {
      tier: "TIER1",
      items: FINANCIAL_REQUIREMENTS.TIER1,
      rule: `Financial Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(FINANCIAL_THRESHOLDS.TIER1_MIN)} → Financial Questionnaire + Large Case Report`
    };
  }
  return null;
}

function formatMMK(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} MMK`;
}
