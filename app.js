const DEFAULT_SAVINGS_GOAL = 1_000_000;
const STORAGE_KEY = "millionSavingsRecords";
const PRIVACY_STORAGE_KEY = "projectDawnPrivacyMode";
const GOAL_STORAGE_KEY = "projectDawnSavingsGoal";
const CUSTOM_BACKGROUND_STORAGE_KEY = "projectDawnCustomBackground";
const MILESTONE_RATIOS = [0.1, 0.25, 0.5, 0.75, 1];

const form = document.querySelector("#recordForm");
const goalSettingsForm = document.querySelector("#goalSettingsForm");
const goalAmountInput = document.querySelector("#goalAmount");
const goalSettingsStatus = document.querySelector("#goalSettingsStatus");
const backgroundUploadInput = document.querySelector("#backgroundUploadInput");
const removeBackgroundButton = document.querySelector("#removeBackgroundButton");
const backgroundStatus = document.querySelector("#backgroundStatus");
const pageTitle = document.querySelector("#page-title");
const privacyModeToggle = document.querySelector("#privacyModeToggle");
const goalBadge = document.querySelector("#goalBadge");
const dateInput = document.querySelector("#recordDate");
const amountInput = document.querySelector("#recordAmount");
const noteInput = document.querySelector("#recordNote");
const formError = document.querySelector("#formError");
const totalAmount = document.querySelector("#totalAmount");
const gapAmount = document.querySelector("#gapAmount");
const remainingAmount = document.querySelector("#remainingAmount");
const completionRate = document.querySelector("#completionRate");
const monthlyAmount = document.querySelector("#monthlyAmount");
const yearlyAmount = document.querySelector("#yearlyAmount");
const largestAmount = document.querySelector("#largestAmount");
const averageMonthlyAmount = document.querySelector("#averageMonthlyAmount");
const monthsToGoal = document.querySelector("#monthsToGoal");
const estimatedGoalDate = document.querySelector("#estimatedGoalDate");
const forecastMessage = document.querySelector("#forecastMessage");
const progressPercent = document.querySelector("#progressPercent");
const progressFill = document.querySelector("#progressFill");
const recordList = document.querySelector("#recordList");
const recordCount = document.querySelector("#recordCount");
const emptyState = document.querySelector("#emptyState");
const exportCsvButton = document.querySelector("#exportCsvButton");
const exportJsonButton = document.querySelector("#exportJsonButton");
const importJsonInput = document.querySelector("#importJsonInput");
const importStatus = document.querySelector("#importStatus");
const trendChart = document.querySelector("#trendChart");
const trendEmptyState = document.querySelector("#trendEmptyState");
const milestoneList = document.querySelector("#milestoneList");

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let records = loadRecords();
let privacyMode = loadPrivacyMode();
let savingsGoal = loadSavingsGoal();
let customBackground = loadCustomBackground();

privacyModeToggle.checked = privacyMode;
dateInput.value = getTodayString();
applyCustomBackground();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = dateInput.value;
  const amount = Number(amountInput.value);
  const note = noteInput.value.trim();

  if (!date) {
    showError("请选择日期。");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showError("请输入大于 0 的存款金额。");
    return;
  }

  records = [
    {
      id: crypto.randomUUID(),
      date,
      amount: Math.round(amount * 100) / 100,
      note,
      createdAt: new Date().toISOString(),
    },
    ...records,
  ];

  persistRecords();
  form.reset();
  dateInput.value = getTodayString();
  showError("");
  render();
});

goalSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nextGoal = Number(goalAmountInput.value);

  if (!Number.isFinite(nextGoal) || nextGoal <= 0) {
    showGoalSettingsStatus("请输入大于 0 的目标金额。", "error");
    return;
  }

  savingsGoal = Math.round(nextGoal * 100) / 100;
  persistSavingsGoal();
  showGoalSettingsStatus("目标金额已更新。", "success");
  render();
});

exportCsvButton.addEventListener("click", () => {
  if (records.length === 0) {
    return;
  }

  exportRecordsAsCsv();
});

exportJsonButton.addEventListener("click", () => {
  if (records.length === 0) {
    return;
  }

  exportRecordsAsJson();
});

importJsonInput.addEventListener("change", () => {
  const [file] = importJsonInput.files;

  if (!file) {
    return;
  }

  importRecordsFromJson(file);
});

backgroundUploadInput.addEventListener("change", () => {
  const [file] = backgroundUploadInput.files;

  if (!file) {
    return;
  }

  importCustomBackground(file);
});

removeBackgroundButton.addEventListener("click", () => {
  customBackground = "";
  localStorage.removeItem(CUSTOM_BACKGROUND_STORAGE_KEY);
  backgroundUploadInput.value = "";
  applyCustomBackground();
  showBackgroundStatus("已恢复默认丝带背景。", "success");
});

privacyModeToggle.addEventListener("change", () => {
  privacyMode = privacyModeToggle.checked;
  persistPrivacyMode();
  render();
});

recordList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-id]");

  if (!button) {
    return;
  }

  records = records.filter((record) => record.id !== button.dataset.deleteId);
  persistRecords();
  render();
});

function loadRecords() {
  const rawRecords = localStorage.getItem(STORAGE_KEY);

  if (rawRecords === null) {
    return [];
  }

  const parsedRecords = JSON.parse(rawRecords);

  if (!Array.isArray(parsedRecords)) {
    throw new Error("localStorage 中的存款记录格式错误。");
  }

  return parsedRecords.map((record) => {
    const amount = Number(record.amount);

    if (!record.id || !record.date || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("localStorage 中存在无效存款记录。");
    }

    return {
      id: String(record.id),
      date: String(record.date),
      amount: Math.round(amount * 100) / 100,
      note: record.note ? String(record.note) : "",
      createdAt: record.createdAt ? String(record.createdAt) : "",
    };
  });
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadPrivacyMode() {
  return localStorage.getItem(PRIVACY_STORAGE_KEY) === "true";
}

function persistPrivacyMode() {
  localStorage.setItem(PRIVACY_STORAGE_KEY, String(privacyMode));
}

function loadSavingsGoal() {
  const rawGoal = localStorage.getItem(GOAL_STORAGE_KEY);

  if (rawGoal === null) {
    return DEFAULT_SAVINGS_GOAL;
  }

  const parsedGoal = Number(rawGoal);

  if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
    throw new Error("localStorage 中的目标金额格式错误。");
  }

  return Math.round(parsedGoal * 100) / 100;
}

function persistSavingsGoal() {
  localStorage.setItem(GOAL_STORAGE_KEY, String(savingsGoal));
}

function loadCustomBackground() {
  return localStorage.getItem(CUSTOM_BACKGROUND_STORAGE_KEY) || "";
}

function applyCustomBackground() {
  const hasCustomBackground = customBackground !== "";

  document.body.classList.toggle("has-custom-background", hasCustomBackground);
  removeBackgroundButton.disabled = !hasCustomBackground;

  if (hasCustomBackground) {
    document.body.style.setProperty(
      "--custom-background-image",
      `url("${customBackground}")`,
    );
    return;
  }

  document.body.style.removeProperty("--custom-background-image");
}

function importCustomBackground(file) {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    showBackgroundStatus("仅支持 png、jpg、jpeg、webp 图片。", "error");
    backgroundUploadInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    customBackground = String(reader.result);
    localStorage.setItem(CUSTOM_BACKGROUND_STORAGE_KEY, customBackground);
    applyCustomBackground();
    showBackgroundStatus("自定义背景已应用。", "success");
    backgroundUploadInput.value = "";
  });

  reader.addEventListener("error", () => {
    showBackgroundStatus("读取背景图片失败。", "error");
    backgroundUploadInput.value = "";
  });

  reader.readAsDataURL(file);
}

function render() {
  const total = records.reduce((sum, record) => sum + record.amount, 0);
  const currentYear = getTodayString().slice(0, 4);
  const currentMonth = getTodayString().slice(0, 7);
  const monthlyTotal = sumRecordsByDatePrefix(currentMonth);
  const yearlyTotal = sumRecordsByDatePrefix(currentYear);
  const largest = records.reduce(
    (max, record) => Math.max(max, record.amount),
    0,
  );
  const monthlyTrend = getMonthlyTrend();
  const remaining = Math.max(savingsGoal - total, 0);
  const averageMonthly = calculateAverageMonthlySavings();
  const forecast = calculateGoalForecast(remaining, averageMonthly);
  const percent = (total / savingsGoal) * 100;
  const cappedPercent = Math.min(percent, 100);
  const percentText = `${percent.toFixed(2)}%`;

  pageTitle.textContent = getPageTitle();
  goalBadge.textContent = `目标 ${formatCurrency(savingsGoal)}`;
  renderGoalSettingsInput();
  totalAmount.textContent = formatCurrency(total);
  gapAmount.textContent = formatCurrency(remaining);
  remainingAmount.textContent = `还差 ${formatCurrency(remaining)}`;
  completionRate.textContent = percentText;
  monthlyAmount.textContent = formatCurrency(monthlyTotal);
  yearlyAmount.textContent = formatCurrency(yearlyTotal);
  largestAmount.textContent = formatCurrency(largest);
  renderForecast(averageMonthly, forecast);
  renderTrend(monthlyTrend);
  renderMilestones(total);
  progressPercent.textContent = percentText;
  progressFill.style.width = `${cappedPercent}%`;
  recordCount.textContent = `${records.length} 条`;
  exportCsvButton.disabled = records.length === 0;
  exportJsonButton.disabled = records.length === 0;

  recordList.innerHTML = records.map(createRecordItem).join("");
  emptyState.hidden = records.length > 0;
}

function sumRecordsByDatePrefix(datePrefix) {
  return records
    .filter((record) => record.date.startsWith(datePrefix))
    .reduce((sum, record) => sum + record.amount, 0);
}

function getMonthlyTrend() {
  const monthlyTotals = records.reduce((totals, record) => {
    const monthKey = record.date.slice(0, 7);
    const currentTotal = totals.get(monthKey) || 0;

    totals.set(monthKey, currentTotal + record.amount);

    return totals;
  }, new Map());

  return Array.from(monthlyTotals.entries())
    .sort(([firstMonth], [secondMonth]) => firstMonth.localeCompare(secondMonth))
    .map(([month, amount]) => ({ month, amount }));
}

function calculateAverageMonthlySavings() {
  const monthlyTotals = records.reduce((totals, record) => {
    const monthKey = record.date.slice(0, 7);
    const currentTotal = totals.get(monthKey) || 0;

    totals.set(monthKey, currentTotal + record.amount);

    return totals;
  }, new Map());

  if (monthlyTotals.size === 0) {
    return 0;
  }

  const total = Array.from(monthlyTotals.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return total / monthlyTotals.size;
}

function calculateGoalForecast(remaining, averageMonthly) {
  if (records.length === 0 || averageMonthly <= 0) {
    return null;
  }

  if (remaining <= 0) {
    return {
      months: 0,
      estimatedDate: getTodayString(),
    };
  }

  const months = Math.ceil(remaining / averageMonthly);

  return {
    months,
    estimatedDate: addMonthsToToday(months),
  };
}

function renderForecast(averageMonthly, forecast) {
  averageMonthlyAmount.textContent = formatCurrency(averageMonthly);

  if (forecast === null) {
    monthsToGoal.textContent = "--";
    estimatedGoalDate.textContent = "--";
    forecastMessage.textContent = "Start saving to unlock your timeline.";
    forecastMessage.classList.remove("is-ready");
    return;
  }

  monthsToGoal.textContent =
    forecast.months === 0 ? "已达成" : `${forecast.months} 个月`;
  estimatedGoalDate.textContent = forecast.estimatedDate;
  forecastMessage.textContent =
    forecast.months === 0
      ? "You have reached your first million."
      : "Based on your current saving pace.";
  forecastMessage.classList.add("is-ready");
}

function renderTrend(monthlyTrend) {
  if (monthlyTrend.length === 0) {
    trendChart.hidden = true;
    trendChart.innerHTML = "";
    trendEmptyState.hidden = false;
    return;
  }

  const maxMonthlyAmount = monthlyTrend.reduce(
    (max, item) => Math.max(max, item.amount),
    0,
  );

  trendChart.hidden = false;
  trendEmptyState.hidden = true;
  trendChart.innerHTML = monthlyTrend
    .map((item) => createTrendBar(item, maxMonthlyAmount))
    .join("");
}

function createTrendBar(item, maxMonthlyAmount) {
  const height = maxMonthlyAmount > 0 ? (item.amount / maxMonthlyAmount) * 100 : 0;

  return `
    <div class="trend-bar">
      <div class="trend-bar__value">${formatCompactCurrency(item.amount)}</div>
      <div class="trend-bar__track">
        <div class="trend-bar__fill" style="height: ${height}%"></div>
      </div>
      <div class="trend-bar__label">${escapeHtml(formatMonthLabel(item.month))}</div>
    </div>
  `;
}

function renderMilestones(total) {
  milestoneList.innerHTML = getMilestones().map((milestone, index) => {
    const isCompleted = total >= milestone;
    const remaining = Math.max(milestone - total, 0);
    const status = isCompleted ? "completed" : "remaining";
    const detail = isCompleted
      ? "已达到"
      : `还差 ${formatCurrency(remaining)}`;

    return `
      <li class="milestone-item ${isCompleted ? "is-completed" : ""}">
        <span class="milestone-dot" aria-hidden="true"></span>
        <div>
          <div class="milestone-title">
            <span>${formatMilestoneTitle(milestone, index)}</span>
            <span class="milestone-status">${status}</span>
          </div>
          <p class="milestone-detail">${detail}</p>
        </div>
      </li>
    `;
  }).join("");
}

function createRecordItem(record) {
  const noteMarkup = record.note
    ? `<p class="record-note">${escapeHtml(record.note)}</p>`
    : "";

  return `
    <li class="record-item">
      <div class="record-main">
        <div class="record-date">${escapeHtml(record.date)}</div>
        <div class="record-amount">${formatCurrency(record.amount)}</div>
        ${noteMarkup}
      </div>
      <button class="delete-button" type="button" data-delete-id="${escapeHtml(record.id)}">
        删除
      </button>
    </li>
  `;
}

function formatCurrency(value) {
  if (privacyMode) {
    return "¥***";
  }

  return currencyFormatter.format(value).replace("CN¥", "¥");
}

function formatCompactCurrency(value) {
  if (privacyMode) {
    return "¥***";
  }

  if (value >= 10_000) {
    return `¥${(value / 10_000).toFixed(1).replace(/\.0$/, "")}万`;
  }

  return formatCurrency(value);
}

function formatMilestoneTitle(value, index) {
  if (privacyMode) {
    return `${formatMilestonePercent(index)} ${formatCurrency(value)}`;
  }

  return `${formatMilestonePercent(index)} ${formatCurrency(value)}`;
}

function formatMilestonePercent(index) {
  return `${Math.round(MILESTONE_RATIOS[index] * 100)}%`;
}

function getMilestones() {
  return MILESTONE_RATIOS.map((ratio) => Math.round(savingsGoal * ratio * 100) / 100);
}

function getPageTitle() {
  return "Project Dawn";
}

function renderGoalSettingsInput() {
  if (privacyMode) {
    goalAmountInput.value = "";
    goalAmountInput.placeholder = "Hidden";
    return;
  }

  goalAmountInput.value = String(savingsGoal);
  goalAmountInput.placeholder = "1000000";
}

function formatMonthLabel(month) {
  const [year, monthNumber] = month.split("-");

  return `${year.slice(2)}.${monthNumber}`;
}

function exportRecordsAsCsv() {
  const headers = ["日期", "本次新增存款金额", "备注", "创建时间"];
  const rows = records.map((record) => [
    record.date,
    record.amount.toFixed(2),
    record.note,
    record.createdAt,
  ]);
  const csv = [headers, ...rows].map(formatCsvRow).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `savings-records-${getTodayString()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function exportRecordsAsJson() {
  const json = JSON.stringify(records, null, 2);
  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `project-dawn-backup-${getTodayString()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
  showImportStatus("JSON 备份已生成。", "success");
}

function importRecordsFromJson(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const importedRecords = parseImportedRecords(String(reader.result));

      if (!window.confirm("导入 JSON 会覆盖当前所有存款记录，是否继续？")) {
        showImportStatus("已取消导入，当前数据未变化。", "");
        return;
      }

      records = importedRecords;
      persistRecords();
      render();
      showImportStatus(`已导入 ${records.length} 条记录。`, "success");
    } catch (error) {
      showImportStatus(error.message, "error");
    } finally {
      importJsonInput.value = "";
    }
  });

  reader.addEventListener("error", () => {
    showImportStatus("读取 JSON 文件失败。", "error");
    importJsonInput.value = "";
  });

  reader.readAsText(file);
}

function parseImportedRecords(jsonText) {
  let parsedRecords;

  try {
    parsedRecords = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON 文件格式错误，当前数据未变化。");
  }

  if (!Array.isArray(parsedRecords)) {
    throw new Error("JSON 数据必须是数组，当前数据未变化。");
  }

  return parsedRecords.map((record, index) =>
    normalizeImportedRecord(record, index),
  );
}

function normalizeImportedRecord(record, index) {
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(`第 ${index + 1} 条记录不是有效对象，当前数据未变化。`);
  }

  if (!("date" in record) || !("amount" in record) || !("note" in record)) {
    throw new Error(
      `第 ${index + 1} 条记录缺少 date、amount 或 note 字段，当前数据未变化。`,
    );
  }

  if (!isValidRecordDate(record.date)) {
    throw new Error(`第 ${index + 1} 条记录的 date 无效，当前数据未变化。`);
  }

  if (
    typeof record.amount !== "number" ||
    !Number.isFinite(record.amount) ||
    record.amount <= 0
  ) {
    throw new Error(`第 ${index + 1} 条记录的 amount 无效，当前数据未变化。`);
  }

  if (typeof record.note !== "string") {
    throw new Error(`第 ${index + 1} 条记录的 note 无效，当前数据未变化。`);
  }

  return {
    id: record.id ? String(record.id) : crypto.randomUUID(),
    date: record.date,
    amount: Math.round(record.amount * 100) / 100,
    note: record.note,
    createdAt: record.createdAt
      ? String(record.createdAt)
      : new Date().toISOString(),
  };
}

function isValidRecordDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return value === formatDate(date);
}

function formatCsvRow(values) {
  return values.map(formatCsvCell).join(",");
}

function formatCsvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function getTodayString() {
  const today = new Date();

  return formatDate(today);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addMonthsToToday(months) {
  const date = new Date();

  date.setMonth(date.getMonth() + months);

  return formatDate(date);
}

function showError(message) {
  formError.textContent = message;
}

function showImportStatus(message, type) {
  importStatus.textContent = message;
  importStatus.classList.toggle("is-error", type === "error");
  importStatus.classList.toggle("is-success", type === "success");
}

function showGoalSettingsStatus(message, type) {
  goalSettingsStatus.textContent = message;
  goalSettingsStatus.classList.toggle("is-error", type === "error");
}

function showBackgroundStatus(message, type) {
  backgroundStatus.textContent = message;
  backgroundStatus.classList.toggle("is-error", type === "error");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
