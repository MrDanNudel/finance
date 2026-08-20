const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

let showAllExpenses = false;
let showAllOverallIncome = false;
let showAllOverallExpenses = false;
let openExpenseCategory = null;
let openIncomeCategory = null;

const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

const incomeList = document.getElementById("incomeList");
const expenseList = document.getElementById("expenseList");

const incomeTotalEl = document.getElementById("incomeTotal");
const expenseTotalEl = document.getElementById("expenseTotal");
const differenceTotalEl = document.getElementById("differenceTotal");

const statisticsBtn = document.getElementById("statisticsBtn");
const allMonthsBtn = document.getElementById("allMonthsBtn");
const summaryArea = document.getElementById("summaryArea");
const statisticsView = document.getElementById("statisticsView");
const allMonthsView = document.getElementById("allMonthsView");
const balanceSection = document.querySelector(".balance-section");
const differenceSection = document.getElementById("differenceSection");

const topIncome = document.getElementById("topIncome");
const topExpenses = document.getElementById("topExpenses");

const statsIncomeTotal = document.getElementById("statsIncomeTotal");
const statsExpenseTotal = document.getElementById("statsExpenseTotal");
const statsIncomeDailyAverage = document.getElementById(
  "statsIncomeDailyAverage",
);
const statsExpenseDailyAverage = document.getElementById(
  "statsExpenseDailyAverage",
);

const incomeChart = document.getElementById("incomeChart");
const expenseChart = document.getElementById("expenseChart");

const incomePieChart = document.getElementById("incomePieChart");
const expensePieChart = document.getElementById("expensePieChart");

const incomeInsights = document.getElementById("incomeInsights");
const expenseInsights = document.getElementById("expenseInsights");

const allMonthsPeriod = document.getElementById("allMonthsPeriod");
const allIncomeTotal = document.getElementById("allIncomeTotal");
const allExpenseTotal = document.getElementById("allExpenseTotal");
const allBalanceTotal = document.getElementById("allBalanceTotal");
const averageMonthlyIncome = document.getElementById("averageMonthlyIncome");
const averageMonthlyExpense = document.getElementById("averageMonthlyExpense");
const averageDailyIncome = document.getElementById("averageDailyIncome");
const averageDailyExpense = document.getElementById("averageDailyExpense");
const savingsRate = document.getElementById("savingsRate");
const allMonthsCalculationNote = document.getElementById(
  "allMonthsCalculationNote",
);
const bestIncomeMonth = document.getElementById("bestIncomeMonth");
const highestExpenseMonth = document.getElementById("highestExpenseMonth");
const bestBalanceMonth = document.getElementById("bestBalanceMonth");
const worstBalanceMonth = document.getElementById("worstBalanceMonth");
const allTopIncome = document.getElementById("allTopIncome");
const allTopExpenses = document.getElementById("allTopExpenses");
const allMonthsComparisonChart = document.getElementById(
  "allMonthsComparisonChart",
);
const allMonthsBalanceChart = document.getElementById("allMonthsBalanceChart");
const allIncomePieChart = document.getElementById("allIncomePieChart");
const allExpensePieChart = document.getElementById("allExpensePieChart");
const allMonthsInsights = document.getElementById("allMonthsInsights");

let incomePieInstance = null;
let expensePieInstance = null;
let allMonthsComparisonInstance = null;
let allMonthsBalanceInstance = null;
let allIncomePieInstance = null;
let allExpensePieInstance = null;

let currentParsedDays = [];
let activeView = "statistics";
const monthlyData = new Map();
let loadedMonthKeys = [];
let currentMonthIndex = -1;

uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", handleFileUpload);
statisticsBtn.addEventListener("click", toggleStatisticsView);
allMonthsBtn.addEventListener("click", toggleAllMonthsView);
prevMonthBtn.addEventListener("click", () => changeMonth(1));
nextMonthBtn.addEventListener("click", () => changeMonth(-1));

async function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  const parsedFiles = await Promise.all(
    files.map(async (file) => {
      const text = await file.text();
      const year = detectYear(text, file.name);

      return parseMonthlyText(text, year);
    }),
  );

  let validFileCount = 0;

  parsedFiles.forEach((parsedData) => {
    if (!parsedData.length) return;

    monthlyData.set(getMonthKey(parsedData), parsedData);
    validFileCount += 1;
  });

  fileInput.value = "";

  if (!validFileCount) {
    alert("לא נמצאו נתונים תקינים בקבצים שנבחרו");
    return;
  }

  loadedMonthKeys = Array.from(monthlyData.keys()).sort();
  currentMonthIndex = loadedMonthKeys.length - 1;

  activeView = "statistics";
  showAllExpenses = false;
  showAllOverallIncome = false;
  showAllOverallExpenses = false;
  openExpenseCategory = null;
  openIncomeCategory = null;

  renderCurrentMonth();
}

function parseMonthlyText(text, year = new Date().getFullYear()) {
  const cleanText = text
    .replace(/\r/g, "")
    .replace(/[⁠]/g, "")
    .replace(/[💰🔻]/g, "");

  const dateRegex = /\*+\s*(\d{2}\.\d{2})\s*\*+/g;
  const matches = [...cleanText.matchAll(dateRegex)];

  const days = [];

  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    const date = currentMatch[1];
    const startIndex = currentMatch.index + currentMatch[0].length;
    const endIndex = nextMatch ? nextMatch.index : cleanText.length;

    const dayContent = cleanText.slice(startIndex, endIndex);

    const expenses = extractSectionItems(dayContent, "הוצאות");
    const income = extractSectionItems(dayContent, "הכנסות");

    days.push({
      date: `${date}.${year}`,
      expenses,
      income,
    });
  }

  return days;
}

function detectYear(text, fileName = "") {
  const yearMatch = `${fileName} ${text}`.match(/\b(20\d{2})\b/);

  return yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
}

function getMonthKey(days) {
  const [, month, year] = days[0].date.split(".");

  return `${year}-${month}`;
}

function renderCurrentMonth() {
  const monthKey = loadedMonthKeys[currentMonthIndex];
  if (!monthKey) return;

  currentParsedDays = monthlyData.get(monthKey) || [];
  showAllExpenses = false;
  openExpenseCategory = null;
  openIncomeCategory = null;

  renderDashboard(currentParsedDays);
  applyActiveView();

  if (activeView === "statistics") {
    renderStatistics(currentParsedDays);
  } else if (activeView === "all") {
    renderAllMonthsSummary();
  }

  updateMonthNavigation();
}

function changeMonth(direction) {
  const nextIndex = currentMonthIndex + direction;

  if (nextIndex < 0 || nextIndex >= loadedMonthKeys.length) return;

  currentMonthIndex = nextIndex;
  renderCurrentMonth();
}

function updateMonthNavigation() {
  const viewingAllMonths = activeView === "all";
  prevMonthBtn.disabled =
    viewingAllMonths || currentMonthIndex >= loadedMonthKeys.length - 1;
  nextMonthBtn.disabled = viewingAllMonths || currentMonthIndex <= 0;
}

function extractSectionItems(dayText, sectionName) {
  const sectionStart = dayText.indexOf(sectionName);
  if (sectionStart === -1) return [];

  const otherSection = sectionName === "הוצאות" ? "הכנסות" : "הוצאות";

  const possibleEnds = [
    dayText.indexOf(otherSection, sectionStart + sectionName.length),
    dayText.search(/סה\s*[״"']?\s*כ/),
  ].filter((index) => index !== -1 && index > sectionStart);

  const sectionEnd = possibleEnds.length
    ? Math.min(...possibleEnds)
    : dayText.length;

  let sectionText = dayText.slice(sectionStart, sectionEnd);
  sectionText = sectionText.replace(sectionName, "");

  const lines = sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];

  lines.forEach((line) => {
    if (/סה\s*[״"']?\s*כ/.test(line) || line.includes("אין הוצאות")) {
      return;
    }

    const cleanLine = line
      .replace(/[⁠]/g, "")
      .replace(/^\*+/, "")
      .replace(/\*+$/, "")
      .replace(/^[-•]/, "")
      .replace(/ש["״']?ח/g, "")
      .replace(/שח/g, "")
      .trim();

    let amount = null;
    let rawName = "";

    const endAmountMatch = cleanLine.match(/([\d,]+)\s*$/);
    const startAmountMatch = cleanLine.match(/^([\d,]+)\s+/);

    if (endAmountMatch) {
      amount = Number(endAmountMatch[1].replace(/,/g, ""));
      rawName = cleanLine
        .replace(endAmountMatch[1], "")
        .replace(/[:：]/g, "")
        .trim();
    } else if (startAmountMatch) {
      amount = Number(startAmountMatch[1].replace(/,/g, ""));
      rawName = cleanLine
        .replace(startAmountMatch[1], "")
        .replace(/[:：]/g, "")
        .trim();
    }

    if (!rawName || isNaN(amount)) return;

    const categoryMatch = rawName.match(/^(.+?)\s*\((.+?)\)$/);

    let category = rawName;
    let detail = rawName;

    if (categoryMatch) {
      category = categoryMatch[1].trim();
      detail = categoryMatch[2].trim();
    }

    items.push({
      name: normalizeCategoryName(category),
      detail,
      amount,
    });
  });

  return items;
}

function normalizeCategoryName(name) {
  const normalizedName = name
    .trim()
    .replace(/[״׳"']/g, "")
    .replace(/\s+/g, " ");

  const reshefSecurityAliases = new Set([
    "רשף ביטחון",
    "רשפ ביטחון",
    "רשף בטחון",
    "רשפ בטחון",
    "ווינגייט אבטחה",
    "וינגייט אבטחה",
    "ווינגייט ביטחון",
    "וינגייט ביטחון",
    "ווינגייט בטחון",
    "וינגייט בטחון",
  ]);

  return reshefSecurityAliases.has(normalizedName) ? "רשף ביטחון" : name;
}

function renderDashboard(days) {
  monthTitle.textContent = detectMonth(days);

  const incomeDays = createDailySummary(days, "income");
  const expenseDays = createDailySummary(days, "expenses");

  const totalIncome = incomeDays.reduce((sum, day) => sum + day.total, 0);
  const totalExpenses = expenseDays.reduce((sum, day) => sum + day.total, 0);

  const difference = totalIncome - totalExpenses;

  differenceTotalEl.textContent = `${formatMoney(difference)} ש״ח`;

  differenceTotalEl.classList.remove(
    "difference-positive",
    "difference-negative",
  );

  if (difference >= 0) {
    differenceTotalEl.classList.add("difference-positive");
  } else {
    differenceTotalEl.classList.add("difference-negative");
  }

  incomeTotalEl.textContent = formatMoney(totalIncome);
  expenseTotalEl.textContent = formatMoney(totalExpenses);

  renderList(incomeList, incomeDays, "income");
  renderList(expenseList, expenseDays, "expense");
}

function createDailySummary(days, key) {
  return days
    .map((day) => ({
      date: day.date,
      items: day[key],
      total: sumItems(day[key]),
    }))
    .filter((day) => day.items.length > 0);
}

function renderList(container, days, type = null) {
  container.classList.remove("empty-box");

  if (days.length === 0) {
    container.classList.add("empty-box");
    container.innerHTML = "אין נתונים להצגה";
    return;
  }

  const highestTotal = type ? Math.max(...days.map((day) => day.total)) : null;

  container.innerHTML = days
    .map((day) => {
      const isHighest = type && day.total === highestTotal;

      const badgeText =
        type === "income" ? "יום ההכנסות הכי גבוה" : "יום ההוצאות הכי גבוה";

      const badgeHTML = isHighest
        ? `<div class="highest-${type}-badge">${badgeText}</div>`
        : "";

      const itemsHTML = day.items
        .map(
          (item) => `
          <div class="item-row">
            <span class="item-name">
              ${item.detail && item.detail !== item.name ? `${item.name} (${item.detail})` : item.name}
            </span>
            <span class="item-amount">${formatMoney(item.amount)} ש״ח</span>
          </div>
        `,
        )
        .join("");

      return `
        <article class="day-card ${isHighest ? `highest-${type}-card` : ""}">
          ${badgeHTML}

          <div class="day-card-header">
            <span class="day-date">${day.date}</span>
            <span class="day-total">סה״כ ${formatMoney(day.total)} ש״ח</span>
          </div>

          <div class="day-items">${itemsHTML}</div>
        </article>
      `;
    })
    .join("");
}

function toggleStatisticsView() {
  if (currentParsedDays.length === 0) {
    alert("קודם צריך להעלות קובץ נתונים");
    return;
  }

  activeView = activeView === "statistics" ? "details" : "statistics";
  renderCurrentMonth();
}

function toggleAllMonthsView() {
  if (monthlyData.size === 0) {
    alert("קודם צריך להעלות לפחות קובץ נתונים אחד");
    return;
  }

  activeView = activeView === "all" ? "statistics" : "all";
  renderCurrentMonth();
}

function applyActiveView() {
  const showDetails = activeView === "details";
  const showStatistics = activeView === "statistics";
  const showAllMonths = activeView === "all";

  summaryArea.classList.toggle("hidden", !showDetails);
  statisticsView.classList.toggle("hidden", !showStatistics);
  allMonthsView.classList.toggle("hidden", !showAllMonths);
  balanceSection.classList.toggle("hidden", showAllMonths);
  differenceSection.classList.toggle("hidden", showAllMonths);

  if (showAllMonths) {
    monthTitle.textContent = "כל החודשים";
    statisticsBtn.textContent = "חזרה לסטטיסטיקה חודשית";
    allMonthsBtn.textContent = "חזרה לחודש הנבחר";
  } else {
    statisticsBtn.textContent = showStatistics
      ? "לצפייה בפירוט מלא"
      : "לצפייה בתצוגה סטטיסטית";
    allMonthsBtn.textContent = "סיכום כל החודשים";
  }
}

function renderStatistics(days) {
  const incomeMap = {};
  const expenseMap = {};

  days.forEach((day) => {
    day.income.forEach((item) => {
      addToCategoryMap(incomeMap, item, day.date);
    });

    day.expenses.forEach((item) => {
      addToCategoryMap(expenseMap, item, day.date);
    });
  });

  const sortedIncome = sortCategoryMap(incomeMap);
  const sortedExpenses = sortCategoryMap(expenseMap);

  const totalIncome = sortedIncome.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = sortedExpenses.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  statsIncomeTotal.textContent = `${formatMoney(totalIncome)} ש״ח`;
  statsExpenseTotal.textContent = `${formatMoney(totalExpenses)} ש״ח`;

  const trackedDayCount = getTrackedDayCount(days);
  const dailyIncomeAverage = trackedDayCount
    ? Math.round(totalIncome / trackedDayCount)
    : 0;
  const dailyExpenseAverage = trackedDayCount
    ? Math.round(totalExpenses / trackedDayCount)
    : 0;

  statsIncomeDailyAverage.textContent = `${formatMoney(dailyIncomeAverage)} ש״ח`;
  statsExpenseDailyAverage.textContent = `${formatMoney(dailyExpenseAverage)} ש״ח`;

  topIncome.innerHTML = renderCategoryStatItems(sortedIncome, "income");
  topExpenses.innerHTML = renderCategoryStatItems(sortedExpenses, "expense");

  connectCategoryClicks();

  renderBarChart(incomeChart, days, "income", "income");
  renderBarChart(expenseChart, days, "expenses", "expense");

  incomePieInstance = renderPieChart(
    incomePieChart,
    incomePieInstance,
    sortedIncome.map((item) => [item.name, item.amount]),
  );

  expensePieInstance = renderPieChart(
    expensePieChart,
    expensePieInstance,
    sortedExpenses.map((item) => [item.name, item.amount]),
  );

  incomeInsights.innerHTML = generateInsights(
    sortedIncome.map((item) => [item.name, item.amount]),
    totalIncome,
    "income",
  );

  expenseInsights.innerHTML = generateInsights(
    sortedExpenses.map((item) => [item.name, item.amount]),
    totalExpenses,
    "expense",
  );
}

function addToCategoryMap(map, item, date) {
  const categoryName = item.name;
  const detailName = item.detail || item.name;

  if (!map[categoryName]) {
    map[categoryName] = {
      name: categoryName,
      amount: 0,
      details: {},
    };
  }

  map[categoryName].amount += item.amount;

  if (!map[categoryName].details[detailName]) {
    map[categoryName].details[detailName] = [];
  }

  map[categoryName].details[detailName].push({
    amount: item.amount,
    date,
  });
}

function sortCategoryMap(map) {
  return Object.values(map)
    .map((category) => ({
      ...category,

      details: Object.entries(category.details)
        .flatMap(([name, entries]) =>
          entries.map((entry) => ({
            name,
            amount: entry.amount,
            date: entry.date,
          })),
        )
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.amount - a.amount);
}

function renderCategoryStatItems(items, type = null) {
  if (items.length === 0) {
    return `<div class="stat-item"><span>אין נתונים</span></div>`;
  }

  const shouldLimit = type === "expense" && !showAllExpenses;
  const visibleItems = shouldLimit ? items.slice(0, 10) : items;

  const openCategory =
    type === "income" ? openIncomeCategory : openExpenseCategory;

  const itemsHtml = visibleItems
    .map((item, index) => {
      const hasDetails = item.details && item.details.length > 1;
      const singleDate = !hasDetails ? item.details?.[0]?.date : "";

      const isOpen = hasDetails && openCategory === item.name;

      const detailsHtml = isOpen
        ? `
            <div class="category-details">
              ${item.details
                .map(
                  (detail) => `
                    <div class="category-detail-row">
                      <span class="category-detail-name">${detail.name}</span>
                      <span class="category-detail-date">${detail.date}</span>
                      <span class="category-detail-amount">${formatMoney(detail.amount)} ש״ח</span>
                    </div>
                  `,
                )
                .join("")}
            </div>
          `
        : "";

      const arrow = hasDetails ? (isOpen ? "▼" : "▶") : "";

      const buttonClass = hasDetails
        ? "stat-item category-toggle clickable"
        : "stat-item";

      const dataAttributes = hasDetails
        ? `data-type="${type}" data-category="${item.name}"`
        : "";

      return `
        <div class="category-stat-block">
          <div class="${buttonClass}" ${dataAttributes}>
            <span>${index + 1}. ${item.name}</span>

            <span class="stat-item-meta">
              ${singleDate ? `<span class="stat-item-date">${singleDate}</span>` : ""}
              <span class="stat-item-amount">
                ${formatMoney(item.amount)} ש״ח
                ${arrow}
              </span>
            </span>
          </div>

          ${detailsHtml}
        </div>
      `;
    })
    .join("");

  const buttonHtml =
    type === "expense" && items.length > 10
      ? `
        <button id="showMoreExpensesBtn" class="show-more-btn">
          ${showAllExpenses ? "הצג פחות" : "הצג עוד"}
        </button>
      `
      : "";

  return itemsHtml + buttonHtml;
}

function connectCategoryClicks() {
  document.querySelectorAll(".category-toggle.clickable").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      const category = button.dataset.category;

      if (type === "income") {
        openIncomeCategory = openIncomeCategory === category ? null : category;
      } else {
        openExpenseCategory =
          openExpenseCategory === category ? null : category;
      }

      renderStatistics(currentParsedDays);
    });
  });

  const showMoreExpensesBtn = document.getElementById("showMoreExpensesBtn");

  if (showMoreExpensesBtn) {
    showMoreExpensesBtn.addEventListener("click", () => {
      showAllExpenses = !showAllExpenses;
      renderStatistics(currentParsedDays);
    });
  }
}

function renderBarChart(container, days, key, type) {
  const [, month = "01", year = new Date().getFullYear()] =
    days[0]?.date.split(".") || [];
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate() || 31;

  const dailyTotals = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = String(index + 1).padStart(2, "0");
    const foundDay = days.find((day) => day.date.startsWith(dayNumber + "."));

    return {
      day: index + 1,
      total: foundDay ? sumItems(foundDay[key]) : 0,
    };
  });

  const maxTotal = Math.max(...dailyTotals.map((day) => day.total), 1);

  container.innerHTML = dailyTotals
    .map((day) => {
      const height = day.total === 0 ? 2 : (day.total / maxTotal) * 100;
      const barClass = type === "income" ? "income-bar" : "expense-bar";

      return `
        <div class="bar-wrap">
          <div class="bar-tooltip">
            יום ${day.day}: ${formatMoney(day.total)} ש״ח
          </div>

          <div class="bar ${barClass}" style="height:${height}%"></div>

          <span class="bar-day">${day.day}</span>
        </div>
      `;
    })
    .join("");
}

function renderPieChart(canvas, chartInstance, sortedItems) {
  if (!canvas) return chartInstance;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = sortedItems.map((item) => item[0]);
  const data = sortedItems.map((item) => item[1]);

  return new Chart(canvas, {
    type: "pie",

    data: {
      labels,
      datasets: [
        {
          data,
          borderWidth: 2,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#ffffff",
            font: {
              size: 14,
            },
          },
        },

        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${formatMoney(context.raw)} ש״ח`;
            },
          },
        },
      },
    },
  });
}

function generateInsights(items, total, type) {
  if (!items.length || total === 0) {
    return `<p>אין מספיק נתונים לניתוח.</p>`;
  }

  const top3 = items.slice(0, 3);
  const top3Total = top3.reduce((sum, item) => sum + item[1], 0);
  const top3Percent = ((top3Total / total) * 100).toFixed(1);

  const title =
    type === "income"
      ? `<span class="income-insight-title">מקורות ההכנסה המרכזיים</span>`
      : `<span class="expense-insight-title">סעיפי ההוצאה המרכזיים</span>`;

  const totalText = type === "income" ? "סה״כ הכנסות" : "סה״כ הוצאות";

  const mainText =
    type === "income" ? "מקור ההכנסה הגדול ביותר" : "ההוצאה הגדולה ביותר";

  const topItemsHtml = top3
    .map(([name, amount]) => {
      const percent = ((amount / total) * 100).toFixed(1);

      return `
        <li>
          <strong>${name}</strong> —
          ${formatMoney(amount)} ש״ח
          <span>(${percent}% מהסה״כ)</span>
        </li>
      `;
    })
    .join("");

  return `
    <div class="insights-content">
      <p><strong>${totalText}:</strong> ${formatMoney(total)} ש״ח</p>

      <p>
        <strong>${mainText}:</strong>
        ${items[0][0]} — ${formatMoney(items[0][1])} ש״ח
        (${((items[0][1] / total) * 100).toFixed(1)}%).
      </p>

      <p><strong>${title}:</strong></p>

      <ol>
        ${topItemsHtml}
      </ol>

      <p>
        שלושת הסעיפים הגדולים מהווים
        <strong>${top3Percent}%</strong>
        מתוך הסה״כ.
      </p>
    </div>
  `;
}

function renderAllMonthsSummary() {
  const summary = createAllMonthsSummary();
  if (!summary.months.length) return;

  const {
    months,
    totalIncome,
    totalExpenses,
    totalBalance,
    trackedDays,
    sortedIncome,
    sortedExpenses,
  } = summary;
  const monthCount = months.length;
  const monthlyIncomeAverage = Math.round(totalIncome / monthCount);
  const monthlyExpenseAverage = Math.round(totalExpenses / monthCount);
  const dailyIncomeAverage = trackedDays
    ? Math.round(totalIncome / trackedDays)
    : 0;
  const dailyExpenseAverage = trackedDays
    ? Math.round(totalExpenses / trackedDays)
    : 0;
  const savingsPercentage = totalIncome
    ? (totalBalance / totalIncome) * 100
    : 0;

  const highestIncome = getExtremeMonth(months, "income", "max");
  const highestExpense = getExtremeMonth(months, "expenses", "max");
  const bestBalance = getExtremeMonth(months, "balance", "max");
  const worstBalance = getExtremeMonth(months, "balance", "min");

  allMonthsPeriod.textContent = `${months[0].label} – ${months[monthCount - 1].label} · ${monthCount} חודשים`;
  allIncomeTotal.textContent = `${formatMoney(totalIncome)} ש״ח`;
  allExpenseTotal.textContent = `${formatMoney(totalExpenses)} ש״ח`;
  allBalanceTotal.textContent = `${formatMoney(totalBalance)} ש״ח`;
  averageMonthlyIncome.textContent = `${formatMoney(monthlyIncomeAverage)} ש״ח`;
  averageMonthlyExpense.textContent = `${formatMoney(monthlyExpenseAverage)} ש״ח`;
  averageDailyIncome.textContent = `${formatMoney(dailyIncomeAverage)} ש״ח`;
  averageDailyExpense.textContent = `${formatMoney(dailyExpenseAverage)} ש״ח`;
  savingsRate.textContent = `${formatPercent(savingsPercentage)}%`;
  allMonthsCalculationNote.textContent = `הממוצע היומי מחושב לפי ${trackedDays} ימים שנכללו בתקופות שהועלו. העלאה חוזרת של אותו חודש מחליפה אותו ואינה נספרת פעמיים.`;

  setSignedValueClass(allBalanceTotal, totalBalance);
  setSignedValueClass(savingsRate, savingsPercentage);
  setMonthHighlight(bestIncomeMonth, highestIncome, "income");
  setMonthHighlight(highestExpenseMonth, highestExpense, "expenses");
  setMonthHighlight(bestBalanceMonth, bestBalance, "balance");
  setMonthHighlight(worstBalanceMonth, worstBalance, "balance");

  const recurringIncome = getRecurringCategories(sortedIncome);
  const recurringExpenses = getRecurringCategories(sortedExpenses);

  renderOverallRankings(recurringIncome, recurringExpenses);

  renderAllMonthsCharts(months);

  allIncomePieInstance = renderPieChart(
    allIncomePieChart,
    allIncomePieInstance,
    sortedIncome.map((item) => [item.name, item.amount]),
  );
  allExpensePieInstance = renderPieChart(
    allExpensePieChart,
    allExpensePieInstance,
    sortedExpenses.map((item) => [item.name, item.amount]),
  );

  allMonthsInsights.innerHTML = generateAllMonthsInsights(summary);
}

function createAllMonthsSummary() {
  const incomeMap = {};
  const expenseMap = {};

  const months = loadedMonthKeys.map((key) => {
    const days = monthlyData.get(key) || [];
    const income = days.reduce((sum, day) => sum + sumItems(day.income), 0);
    const expenses = days.reduce((sum, day) => sum + sumItems(day.expenses), 0);

    days.forEach((day) => {
      day.income.forEach((item) => addToCategoryMap(incomeMap, item, day.date));
      day.expenses.forEach((item) =>
        addToCategoryMap(expenseMap, item, day.date),
      );
    });

    return {
      key,
      label: detectMonth(days),
      income,
      expenses,
      balance: income - expenses,
      trackedDays: getTrackedDayCount(days),
    };
  });

  const totalIncome = months.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = months.reduce((sum, month) => sum + month.expenses, 0);

  return {
    months,
    totalIncome,
    totalExpenses,
    totalBalance: totalIncome - totalExpenses,
    trackedDays: months.reduce((sum, month) => sum + month.trackedDays, 0),
    sortedIncome: sortCategoryMap(incomeMap),
    sortedExpenses: sortCategoryMap(expenseMap),
  };
}

function getExtremeMonth(months, key, mode) {
  return months.reduce((selected, month) => {
    if (!selected) return month;
    return mode === "min"
      ? month[key] < selected[key]
        ? month
        : selected
      : month[key] > selected[key]
        ? month
        : selected;
  }, null);
}

function setMonthHighlight(element, month, key) {
  if (!month) {
    element.textContent = "—";
    return;
  }

  element.textContent = `${month.label} · ${formatMoney(month[key])} ש״ח`;
  if (key === "balance") setSignedValueClass(element, month[key]);
}

function setSignedValueClass(element, value) {
  element.classList.remove("difference-positive", "difference-negative");
  element.classList.add(
    value >= 0 ? "difference-positive" : "difference-negative",
  );
}

function renderOverallRanking(items, type) {
  if (!items.length) {
    return `<div class="stat-item"><span>אין קטגוריות שחזרו ביותר מחודש אחד</span></div>`;
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const showAll =
    type === "income" ? showAllOverallIncome : showAllOverallExpenses;
  const visibleItems = showAll ? items : items.slice(0, 10);

  const rowsHtml = visibleItems
    .map((item, index) => {
      const percentage = total ? (item.amount / total) * 100 : 0;

      return `
        <div class="overall-rank-row ${type}-rank-row">
          <span class="overall-rank-name">${index + 1}. ${item.name}</span>
          <span class="overall-rank-meta">
            <small>${formatPercent(percentage)}%</small>
            <strong>${formatMoney(item.amount)} ש״ח</strong>
          </span>
        </div>
      `;
    })
    .join("");

  const buttonHtml =
    items.length > 10
      ? `
        <button
          class="show-more-btn overall-show-more-btn ${type}-overall-show-more"
          data-overall-type="${type}"
          type="button"
        >
          ${showAll ? "הצג פחות" : `הצג עוד (${items.length - 10})`}
        </button>
      `
      : "";

  return rowsHtml + buttonHtml;
}

function getRecurringCategories(items) {
  return items.filter((item) => {
    const monthsWithActivity = new Set(
      item.details
        .map((detail) => {
          const [, month, year] = detail.date.split(".");
          return month && year ? `${year}-${month}` : null;
        })
        .filter(Boolean),
    );

    return monthsWithActivity.size >= 2;
  });
}

function renderOverallRankings(sortedIncome, sortedExpenses) {
  allTopIncome.innerHTML = renderOverallRanking(sortedIncome, "income");
  allTopExpenses.innerHTML = renderOverallRanking(sortedExpenses, "expense");

  document.querySelectorAll("[data-overall-type]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.overallType === "income") {
        showAllOverallIncome = !showAllOverallIncome;
      } else {
        showAllOverallExpenses = !showAllOverallExpenses;
      }

      renderOverallRankings(sortedIncome, sortedExpenses);
    });
  });
}

function renderAllMonthsCharts(months) {
  const labels = months.map((month) => month.label);
  const sharedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#ffffff" },
      },
      tooltip: {
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${formatMoney(context.raw)} ש״ח`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#b9cde2" },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#b9cde2",
          callback(value) {
            return formatMoney(value);
          },
        },
        grid: { color: "rgba(255,255,255,0.08)" },
      },
    },
  };

  if (allMonthsComparisonInstance) allMonthsComparisonInstance.destroy();
  allMonthsComparisonInstance = new Chart(allMonthsComparisonChart, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "הכנסות",
          data: months.map((month) => month.income),
          backgroundColor: "rgba(70, 255, 166, 0.72)",
          borderColor: "#46ffa6",
          borderWidth: 1,
          borderRadius: 8,
        },
        {
          label: "הוצאות",
          data: months.map((month) => month.expenses),
          backgroundColor: "rgba(255, 119, 119, 0.72)",
          borderColor: "#ff7777",
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    },
    options: sharedOptions,
  });

  if (allMonthsBalanceInstance) allMonthsBalanceInstance.destroy();
  allMonthsBalanceInstance = new Chart(allMonthsBalanceChart, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "מאזן חודשי",
          data: months.map((month) => month.balance),
          borderColor: "#79b8ff",
          backgroundColor: "rgba(121, 184, 255, 0.16)",
          pointBackgroundColor: months.map((month) =>
            month.balance >= 0 ? "#46ffa6" : "#ff7777",
          ),
          pointRadius: 5,
          tension: 0.32,
          fill: true,
        },
      ],
    },
    options: sharedOptions,
  });
}

function generateAllMonthsInsights(summary) {
  const { months, totalIncome, totalExpenses, totalBalance, sortedExpenses } =
    summary;
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const topExpense = sortedExpenses[0];
  const balanceText =
    totalBalance >= 0
      ? `נשארו ${formatMoney(totalBalance)} ש״ח לאחר ההוצאות.`
      : `ההוצאות גבוהות מההכנסות ב־${formatMoney(Math.abs(totalBalance))} ש״ח.`;

  let trendText = "נדרש לפחות מידע משני חודשים כדי לזהות שינוי חודשי.";
  if (months.length > 1) {
    const expenseChange = firstMonth.expenses
      ? ((lastMonth.expenses - firstMonth.expenses) / firstMonth.expenses) * 100
      : 0;
    const direction = expenseChange > 0 ? "עלו" : "ירדו";
    trendText = `מהחודש הראשון לאחרון ההוצאות ${direction} ב־${formatPercent(Math.abs(expenseChange))}%.`;
  }

  const topExpenseText = topExpense
    ? `קטגוריית ההוצאה הגדולה ביותר היא <strong>${topExpense.name}</strong>, בסך ${formatMoney(topExpense.amount)} ש״ח.`
    : "לא הוזנו קטגוריות הוצאה.";

  const expenseRatio = totalIncome ? (totalExpenses / totalIncome) * 100 : 0;

  return `
    <p><strong>תמונת מצב:</strong> ${balanceText}</p>
    <p><strong>יחס הוצאות להכנסות:</strong> ${formatPercent(expenseRatio)}%.</p>
    <p><strong>הוצאה מרכזית:</strong> ${topExpenseText}</p>
    <p><strong>מגמה:</strong> ${trendText}</p>
  `;
}

function formatPercent(value) {
  return Number(value).toLocaleString("he-IL", {
    maximumFractionDigits: 1,
  });
}

function detectMonth(days) {
  if (!days.length) return "חודש נוכחי";

  const firstDate = days[0].date;
  const [, monthNumber, year] = firstDate.split(".");

  const months = {
    "01": "ינואר",
    "02": "פברואר",
    "03": "מרץ",
    "04": "אפריל",
    "05": "מאי",
    "06": "יוני",
    "07": "יולי",
    "08": "אוגוסט",
    "09": "ספטמבר",
    10: "אוקטובר",
    11: "נובמבר",
    12: "דצמבר",
  };

  return months[monthNumber] ? `${months[monthNumber]} ${year}` : "חודש נוכחי";
}

function sortMap(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function sumItems(items) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function getTrackedDayCount(days) {
  const dayNumbers = days
    .map((day) => Number(day.date.split(".")[0]))
    .filter((dayNumber) => Number.isFinite(dayNumber));

  return dayNumbers.length ? Math.max(...dayNumbers) : 0;
}

function formatMoney(value) {
  return Number(value).toLocaleString("he-IL");
}
