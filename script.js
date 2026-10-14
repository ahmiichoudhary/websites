const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const historyEl = document.getElementById("history");
const historyCountEl = document.getElementById("historyCount");
const scientificPad = document.getElementById("scientificPad");
const modeBtn = document.getElementById("modeBtn");
const themeBtn = document.getElementById("themeBtn");

let expression = "";
let justCalculated = false;
let history = JSON.parse(localStorage.getItem("calcnova-history") || "[]");

function render() {
  expressionEl.textContent = expression || "0";
  resultEl.textContent = expression ? preview(expression) : "0";
}

function cleanExpression(value) {
  return value
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-");
}

function safeEvaluate(value) {
  let exp = cleanExpression(value)
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/g, "Math.E")
    .replace(/\^/g, "**")
    .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

  if (!/^[0-9+\-*/().\sA-Za-z]+$/.test(exp)) throw new Error("Invalid");
  if (/Math\.(?!PI|E)/.test(exp)) throw new Error("Invalid");

  return Function('"use strict"; return (' + exp + ')')();
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-9)) {
    return value.toExponential(8).replace(/\.?0+e/, "e");
  }
  return Number(value.toFixed(12)).toLocaleString("en-US", {
    maximumFractionDigits: 12
  });
}

function preview(value) {
  try {
    const result = safeEvaluate(value);
    return formatNumber(result);
  } catch {
    return "0";
  }
}

function addToExpression(value) {
  if (justCalculated && /[0-9.]/.test(value)) expression = "";
  justCalculated = false;

  const last = expression.slice(-1);

  if (value === ".") {
    const current = expression.split(/[+\-*/]/).pop();
    if (current.includes(".")) return;
    if (!current) value = "0.";
  }

  if (/[+\-*/]/.test(value) && /[+\-*/]/.test(last)) {
    expression = expression.slice(0, -1);
  }

  expression += value;
  render();
}

function calculate() {
  if (!expression) return;
  try {
    const raw = safeEvaluate(expression);
    const formatted = formatNumber(raw);

    if (formatted === "Error") throw new Error("Math error");

    addHistory(expression, formatted);
    expression = String(raw);
    justCalculated = true;
    render();
    resultEl.textContent = formatted;
  } catch {
    resultEl.textContent = "Error";
  }
}

function addHistory(exp, result) {
  history.unshift({ exp, result });
  history = history.slice(0, 30);
  localStorage.setItem("calcnova-history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyCountEl.textContent = `${history.length} calculation${history.length === 1 ? "" : "s"}`;

  if (!history.length) {
    historyEl.innerHTML = '<p class="empty">Your calculations will appear here.</p>';
    return;
  }

  historyEl.innerHTML = history.map((item, index) => `
    <div class="history-item" data-history="${index}">
      <div class="history-expression">${escapeHTML(item.exp)}</div>
      <div class="history-result">= ${escapeHTML(item.result)}</div>
    </div>
  `).join("");

  historyEl.querySelectorAll("[data-history]").forEach(item => {
    item.addEventListener("click", () => {
      expression = history[Number(item.dataset.history)].exp;
      justCalculated = false;
      render();
    });
  });
}

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  }[char]));
}

function scientificFunction(fn) {
  let value;
  try {
    value = safeEvaluate(expression || "0");
  } catch {
    value = 0;
  }

  let output;
  const radians = value * Math.PI / 180;

  if (fn === "sin") output = Math.sin(radians);
  if (fn === "cos") output = Math.cos(radians);
  if (fn === "tan") output = Math.tan(radians);
  if (fn === "sqrt") output = Math.sqrt(value);
  if (fn === "log") output = Math.log10(value);
  if (fn === "ln") output = Math.log(value);

  if (!Number.isFinite(output)) {
    resultEl.textContent = "Error";
    return;
  }

  expression = String(output);
  justCalculated = true;
  render();
}

document.querySelectorAll("[data-value]").forEach(button => {
  button.addEventListener("click", () => addToExpression(button.dataset.value));
});

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    if (action === "clear") {
      expression = "";
      justCalculated = false;
      render();
    }

    if (action === "backspace") {
      expression = expression.slice(0, -1);
      justCalculated = false;
      render();
    }

    if (action === "percent") {
      if (expression) expression += "%";
      render();
    }

    if (action === "equals") calculate();

    if (action === "constant") {
      if (justCalculated) expression = "";
      expression += button.dataset.value === "Math.PI" ? "pi" : "e";
      justCalculated = false;
      render();
    }

    if (action === "func") scientificFunction(button.dataset.value);

    if (action === "square") {
      if (expression) expression = `(${expression})^2`;
      render();
    }

    if (action === "inverse") {
      if (expression) expression = `(1/(${expression}))`;
      render();
    }
  });
});

modeBtn.addEventListener("click", () => {
  scientificPad.classList.toggle("hidden");
  modeBtn.textContent = scientificPad.classList.contains("hidden") ? "Scientific" : "Basic";
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("calcnova-theme", dark ? "dark" : "light");
  themeBtn.textContent = dark ? "☾" : "☀";
});

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  history = [];
  localStorage.removeItem("calcnova-history");
  renderHistory();
});

document.addEventListener("keydown", event => {
  if (/^[0-9.]$/.test(event.key)) addToExpression(event.key);
  else if (["+", "-", "*", "/"].includes(event.key)) addToExpression(event.key);
  else if (event.key === "Enter" || event.key === "=") calculate();
  else if (event.key === "Backspace") {
    expression = expression.slice(0, -1);
    render();
  } else if (event.key === "Escape") {
    expression = "";
    render();
  } else if (event.key === "%") {
    if (expression) expression += "%";
    render();
  }
});

if (localStorage.getItem("calcnova-theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☾";
}

render();
renderHistory();
