/** TSAR for a single application/policy entry. */
function computeTSAR(faceAmount, product) {
  const rate = PRODUCT_RATES[product];
  if (rate === undefined) return 0;
  const amount = Number(faceAmount) || 0;
  if (amount <= 0) return 0;
  return amount * rate;
}

function computeGrandTSAR(currentTSAR, concurrentTSARList) {
  const concurrentSum = concurrentTSARList.reduce((sum, v) => sum + (Number(v) || 0), 0);
  return (Number(currentTSAR) || 0) + concurrentSum;
}

function getAgeBand(age) {
  const a = Number(age);
  if (a < 18) return "<18";
  if (a >= 18 && a <= 45) return "18-45";
  if (a >= 46 && a <= 60) return "46-60";
  return "out of range";
}

function determineMED(grandTSAR, agentType, age) {
  const band = getAgeBand(age);
  const tsar = Number(grandTSAR) || 0;

  if (band === "<18") {
    if (tsar > THRESHOLD_LT18.MED2_MIN) {
      return {
        action: "MED2",
        band,
        rule: `Age < 18: Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(THRESHOLD_LT18.MED2_MIN)} → MED2`
      };
    }
    return {
      action: "None",
      band,
      rule: `Age < 18: Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(THRESHOLD_LT18.MED2_MIN)} → None`
    };
  }

  if (band === "18-45") {
    const threshold = THRESHOLD_18_45[agentType];
    if (tsar <= threshold) {
      return {
        action: "None",
        band,
        rule: `Age 18-45, ${agentType}: Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(threshold)} → None`
      };
    }
    return {
      action: "MED4",
      band,
      rule: `Age 18-45, ${agentType}: Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(threshold)} → MED4`
    };
  }

  if (band === "46-60") {
    if (tsar <= THRESHOLD_46_60.MED3_MAX) {
      return {
        action: "MED3",
        band,
        rule: `Age 46-60: Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(THRESHOLD_46_60.MED3_MAX)} → MED3`
      };
    }
    if (tsar <= THRESHOLD_46_60.MED4_MAX) {
      return {
        action: "MED4",
        band,
        rule: `Age 46-60: ${formatMMK(THRESHOLD_46_60.MED3_MAX)} < Grand TSAR (${formatMMK(tsar)}) ≤ ${formatMMK(THRESHOLD_46_60.MED4_MAX)} → MED4`
      };
    }
    return {
      action: "MED5",
      band,
      rule: `Age 46-60: Grand TSAR (${formatMMK(tsar)}) > ${formatMMK(THRESHOLD_46_60.MED4_MAX)} → MED5`
    };
  }

  return {
    action: "UNDEFINED",
    band,
    rule: `No rule is defined for age band ${band} (age=${age}) and agent type ${agentType}.`
  };
}

function formatMMK(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} MMK`;
}
