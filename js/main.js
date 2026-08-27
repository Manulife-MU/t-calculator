document.addEventListener("DOMContentLoaded", () => {

  const agentTypeSelect = document.getElementById("agentType");
  const liAgeSelect = document.getElementById("liAge");
  const ageBandHint = document.getElementById("ageBandHint");

  const currentProductSelect = document.querySelector(".current-product");
  const currentFaceInput = document.querySelector(".current-face");
  const currentTsarBadge = document.querySelector(".current-tsar");

  const concurrentList = document.getElementById("concurrentList");
  const noConcurrentMsg = document.getElementById("noConcurrentMsg");
  const addConcurrentBtn = document.getElementById("addConcurrentBtn");
  const rowTemplate = document.getElementById("concurrentRowTemplate");

  const grandTsarValue = document.getElementById("grandTsarValue");
  const finalActionBadge = document.getElementById("finalActionBadge");
  const ageBandUsed = document.getElementById("ageBandUsed");
  const ruleExplanation = document.getElementById("ruleExplanation");

  // ---------- Populate static dropdowns ----------
  function fillSelect(select, values) {
    select.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join("");
  }

  fillSelect(agentTypeSelect, AGENT_TYPES);
  fillSelect(liAgeSelect, AGE_OPTIONS);
  fillSelect(currentProductSelect, Object.keys(PRODUCT_RATES));

  // ---------- Currency input formatting ----------
  function parseNumber(str) {
    const n = parseFloat(String(str).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function formatInputValue(input) {
    const raw = input.value.replace(/[^\d.]/g, "");
    if (raw === "") { input.value = ""; return; }
    const parts = raw.split(".");
    const intPart = parts[0].replace(/^0+(?=\d)/, "");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    input.value = parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
  }

  document.addEventListener("input", (e) => {
    if (e.target.classList.contains("currency-input")) {
      formatInputValue(e.target);
      recalculate();
    }
  });

  // ---------- Concurrent rows ----------
  function addConcurrentRow() {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".concurrent-row");
    fillSelect(row.querySelector(".concurrent-product"), Object.keys(PRODUCT_RATES));
    row.querySelector(".remove-concurrent-btn").addEventListener("click", () => {
      row.remove();
      toggleEmptyMsg();
      recalculate();
    });
    concurrentList.appendChild(row);
    toggleEmptyMsg();
    recalculate();
  }

  function toggleEmptyMsg() {
    noConcurrentMsg.classList.toggle("d-none", concurrentList.children.length > 0);
  }

  addConcurrentBtn.addEventListener("click", addConcurrentRow);

  // ---------- Recalculation (runs on any relevant change) ----------
  function recalculate() {
    // Current application
    const currentFace = parseNumber(currentFaceInput.value);
    const currentProduct = currentProductSelect.value;
    const currentTSAR = computeTSAR(currentFace, currentProduct);
    currentTsarBadge.textContent = formatMMK(currentTSAR);

    // Concurrent entries
    const concurrentTSARs = [];
    concurrentList.querySelectorAll(".concurrent-row").forEach(row => {
      const face = parseNumber(row.querySelector(".concurrent-face").value);
      const product = row.querySelector(".concurrent-product").value;
      const tsar = computeTSAR(face, product);
      row.querySelector(".concurrent-tsar").textContent = formatMMK(tsar);
      concurrentTSARs.push(tsar);
    });

    // Grand TSAR
    const grandTSAR = computeGrandTSAR(currentTSAR, concurrentTSARs);
    grandTsarValue.textContent = formatMMK(grandTSAR);
  
    // Decision
    const agentType = agentTypeSelect.value;
    const age = liAgeSelect.value;
    const result = determineMED(grandTSAR, agentType, age);

    const style = ACTION_STYLE[result.action] || ACTION_STYLE["UNDEFINED"];
    finalActionBadge.className = `badge fs-5 px-3 py-2 ${style.badge}`;
    finalActionBadge.textContent = style.label;

    ageBandUsed.textContent = result.band;
    ruleExplanation.textContent = result.rule;

    ageBandHint.textContent = `Age band: ${getAgeBand(age)}`;
  }

  // ---------- Wire up remaining static inputs ----------
  agentTypeSelect.addEventListener("change", recalculate);
  liAgeSelect.addEventListener("change", recalculate);
  currentProductSelect.addEventListener("change", recalculate);

  // ---------- Initial state ----------
  addConcurrentRow();
  recalculate();
});
