const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

let showAllExpenses = false;
let openExpenseCategory = null;
let openIncomeCategory = null;

const monthTitle = document.getElementById("monthTitle");

const incomeList = document.getElementById("incomeList");
const expenseList = document.getElementById("expenseList");

const incomeTotalEl = document.getElementById("incomeTotal");
const expenseTotalEl = document.getElementById("expenseTotal");
const differenceTotalEl = document.getElementById("differenceTotal");

const statisticsBtn = document.getElementById("statisticsBtn");
const summaryArea = document.getElementById("summaryArea");
const statisticsView = document.getElementById("statisticsView");

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

let incomePieInstance = null;
let expensePieInstance = null;

let currentParsedDays = [];
let statisticsMode = false;

uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", handleFileUpload);
statisticsBtn.addEventListener("click", toggleStatisticsView);

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    const parsedData = parseMonthlyText(text);

    currentParsedDays = parsedData;
    statisticsMode = false;
    showAllExpenses = false;
    openExpenseCategory = null;
    openIncomeCategory = null;

    summaryArea.classList.remove("hidden");
    statisticsView.classList.add("hidden");
    statisticsBtn.textContent = "לצפייה בתצוגה סטטיסטית";

    renderDashboard(parsedData);
  };

  reader.readAsText(file, "UTF-8");
}

function parseMonthlyText(text) {
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
      date: `${date}.2026`,
      expenses,
      income,
    });
  }

  return days;
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
      name: category,
      detail,
      amount,
    });
  });

  return items;
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

  statisticsMode = !statisticsMode;

  if (statisticsMode) {
    summaryArea.classList.add("hidden");
    statisticsView.classList.remove("hidden");
    statisticsBtn.textContent = "לצפייה בפירוט מלא";
    renderStatistics(currentParsedDays);
  } else {
    summaryArea.classList.remove("hidden");
    statisticsView.classList.add("hidden");
    statisticsBtn.textContent = "לצפייה בתצוגה סטטיסטית";
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
  const dailyTotals = Array.from({ length: 31 }, (_, index) => {
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

function detectMonth(days) {
  if (!days.length) return "חודש נוכחי";

  const firstDate = days[0].date;
  const monthNumber = firstDate.split(".")[1];

  const months = {
    "01": "ינואר 2026",
    "02": "פברואר 2026",
    "03": "מרץ 2026",
    "04": "אפריל 2026",
    "05": "מאי 2026",
    "06": "יוני 2026",
    "07": "יולי 2026",
    "08": "אוגוסט 2026",
    "09": "ספטמבר 2026",
    10: "אוקטובר 2026",
    11: "נובמבר 2026",
    12: "דצמבר 2026",
  };

  return months[monthNumber] || "חודש נוכחי";
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
