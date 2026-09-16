document.addEventListener("DOMContentLoaded", () => {
  // Enable the LI Age info popover
  document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => new bootstrap.Popover(el));

  const agentTypeSelect = document.getElementById("agentType");
  const liAgeSelect = document.getElementById("liAge");

  const currentProductSelect = document.querySelector(".current-product");
  const currentFaceInput = document.querySelector(".current-face");
  const currentTsarBadge = document.querySelector(".current-tsar");

  const concurrentList = document.getElementById("concurrentList");
  const noConcurrentMsg = document.getElementById("noConcurrentMsg");
  const addConcurrentBtn = document.getElementById("addConcurrentBtn");
  const rowTemplate = document.getElementById("concurrentRowTemplate");

  const medicalGrandTsarValue = document.getElementById("medicalGrandTsarValue");
  const financialGrandTsarValue = document.getElementById("financialGrandTsarValue");
  const medicalActionBadge = document.getElementById("medicalActionBadge");
  const financialRequirementList = document.getElementById("financialRequirementList");

  function fillSelect(select, values, placeholderText) {
    const placeholder = `<option value="" disabled selected hidden>${placeholderText}</option>`;
    const options = values.map(v => `<option value="${v}">${v}</option>`).join("");
    select.innerHTML = placeholder + options;
  }

  fillSelect(agentTypeSelect, AGENT_TYPES, "-- Select Advisor Type --");
  fillSelect(liAgeSelect, AGE_OPTIONS, "-- Select LI Age --");
  fillSelect(currentProductSelect, Object.keys(PRODUCT_RATES), "-- Select Product --");

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

  document.addEventListener("change", (e) => {
    if (e.target.matches(".concurrent-product, .issue-duration")) {
      recalculate();
    }
  });

  // ---------- Concurrent rows ----------
  function addConcurrentRow() {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".concurrent-row");
    fillSelect(row.querySelector(".concurrent-product"), Object.keys(PRODUCT_RATES), "-- Select Product --");
    fillSelect(row.querySelector(".issue-duration"), Object.keys(ISSUED_DURATION), "-- Select Duration --");
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

  function renderMedicalPlaceholder(message) {
    medicalActionBadge.className = "badge fs-6 px-3 py-2 bg-secondary";
    medicalActionBadge.textContent = message;
  }

  function renderMedical(result) {
    const style = ACTION_STYLE[result.action] || ACTION_STYLE["UNDEFINED"];
    medicalActionBadge.className = `badge fs-6 px-3 py-2 text-bg-info`;
    medicalActionBadge.textContent = style.label;
  }

  function renderFinancialPlaceholder(message) {
    financialRequirementList.innerHTML = `<li class="text-muted">${message}</li>`;
  }

  function renderFinancial(result) {
    financialRequirementList.innerHTML = result.items.map(item => `<li>${item}</li>`).join("");
  }

  // ---------- Recalculation (runs on any relevant change) ----------
  function recalculate() {
    // Current application
    const currentFace = parseNumber(currentFaceInput.value);
    const currentProduct = currentProductSelect.value; // "" if not yet selected
    const currentTSAR = computeTSAR(currentFace, currentProduct);
    currentTsarBadge.textContent = formatMMK(currentTSAR);

    const allConcurrentTSARs = [];
    const medicalIncludedTSARs = [];

    concurrentList.querySelectorAll(".concurrent-row").forEach(row => {
      const face = parseNumber(row.querySelector(".concurrent-face").value);
      const product = row.querySelector(".concurrent-product").value;
      const issuedDuration = row.querySelector(".issue-duration").value;
      const tsar = computeTSAR(face, product);

      row.querySelector(".concurrent-tsar").textContent = formatMMK(tsar);

      allConcurrentTSARs.push(tsar);

      const includedInMedical = shouldIncludeInMedicalGrandTSAR(issuedDuration);
      if (includedInMedical) {
        medicalIncludedTSARs.push(tsar);
      }

      row.classList.toggle("border-warning", !includedInMedical);
    });

    const medicalGrandTSAR = computeMedicalGrandTSAR(currentTSAR, medicalIncludedTSARs);
    const financialGrandTSAR = computeFinancialGrandTSAR(currentTSAR, allConcurrentTSARs);

    medicalGrandTsarValue.textContent = formatMMK(medicalGrandTSAR);
    financialGrandTsarValue.textContent = formatMMK(financialGrandTSAR);

    if (!currentProduct || currentFace <= 0) {
      // renderFinancialPlaceholder("Enter Product & Face Amount to calculate");
      renderFinancialPlaceholder("");
    } else {
      const financial = determineFinancial(financialGrandTSAR);
      renderFinancial(financial);
    }

    const isTKKW = currentProduct === "TKKW";
    const agentType = agentTypeSelect.value;
    const age = liAgeSelect.value;

    const missingCommonInputs = !age || !currentProduct || currentFace <= 0;
    const missingAgentType = !isTKKW && !agentType;

    if (missingCommonInputs || missingAgentType) {
      // renderMedicalPlaceholder(
      //   isTKKW
      //     ? "Please select LI Age & Product"
      //     : "Please select Advisor Type, LI Age & Product"
      // );
      renderMedicalPlaceholder(null);
      return;
    }

    const medical = determineMED(medicalGrandTSAR, agentType, age, currentProduct);
    renderMedical(medical);
  }

  // ---------- Wire up remaining static inputs ----------
  agentTypeSelect.addEventListener("change", recalculate);
  liAgeSelect.addEventListener("change", recalculate);
  currentProductSelect.addEventListener("change", recalculate);

  // ---------- Initial state ----------
  addConcurrentRow();
  recalculate();
});
