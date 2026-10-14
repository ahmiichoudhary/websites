(() => {
  "use strict";

  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const messageEl = document.getElementById("display-message");
  const keypad = document.getElementById("keypad");
  const historyToggle = document.getElementById("history-toggle");
  const historyPanel = document.getElementById("history-panel");
  const historyList = document.getElementById("history-list");
  const clearHistoryButton = document.getElementById("clear-history");
  const themeToggle = document.getElementById("theme-toggle");
  const toast = document.getElementById("toast");

  let current = "0";
  let expression = "";
  let freshEntry = true;
  let lastAnswer = 0;
  let history = [];
  let toastTimer;

  document.getElementById("year").textContent = new Date().getFullYear();

  function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.classList.toggle("error", isError);
  }

  function notify(text) {
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) throw new Error("That calculation is not a finite number.");
    if (Object.is(value, -0)) value = 0;
    const rounded = Number(value.toPrecision(12));
    return String(rounded);
  }

  function prettyNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 }).format(n);
  }

  function render() {
    expressionEl.textContent = expression || current;
    resultEl.textContent = prettyNumber(current);
    resultEl.title = current;
  }

  function inputDigit(digit) {
    if (freshEntry) {
      current = digit;
      expression = "";
      freshEntry = false;
    } else if (current.replace("-", "").length < 16) {
      current = current === "0" ? digit : current + digit;
    }
    showMessage("Ready when you are");
    render();
  }

  function inputDecimal() {
    if (freshEntry) {
      current = "0.";
      expression = "";
      freshEntry = false;
    } else if (!current.includes(".")) {
      current += ".";
    }
    render();
  }

  function setOperator(operator) {
    if (expression && /[+−×÷]$/.test(expression)) {
      expression = expression.slice(0, -1) + operator;
    } else {
      expression = (expression ? expression + current : current) + operator;
    }
    freshEntry = true;
    showMessage("Choose the next number");
    render();
  }

  // Safe arithmetic parser: only numbers and the four supported operators are accepted.
  // No eval() or Function() is used.
  function tokenize(input) {
    const normalized = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s+/g, "");
    const tokens = [];
    let i = 0;
    while (i < normalized.length) {
      const rest = normalized.slice(i);
      const numberMatch = rest.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
      if (numberMatch) {
        tokens.push(Number(numberMatch[0]));
        i += numberMatch[0].length;
        continue;
      }
      const ch = normalized[i];
      if ("+-*/()".includes(ch)) {
        tokens.push(ch);
        i++;
        continue;
      }
      throw new Error("Please check the expression.");
    }
    return tokens;
  }

  function calculate(input) {
    const tokens = tokenize(input);
    let pos = 0;

    function parsePrimary() {
      const token = tokens[pos];
      if (token === "+" || token === "-") {
        pos++;
        const val = parsePrimary();
        return token === "-" ? -val : val;
      }
      if (token === "(") {
        pos++;
        const val = parseExpression();
        if (tokens[pos] !== ")") throw new Error("Missing closing bracket.");
        pos++;
        return val;
      }
      if (typeof token === "number" && Number.isFinite(token)) {
        pos++;
        return token;
      }
      throw new Error("Please enter a number.");
    }

    function parseTerm() {
      let value = parsePrimary();
      while (tokens[pos] === "*" || tokens[pos] === "/") {
        const op = tokens[pos++];
        const right = parsePrimary();
        if (op === "/" && right === 0) throw new Error("Cannot divide by zero.");
        value = op === "*" ? value * right : value / right;
      }
      return value;
    }

    function parseExpression() {
      let value = parseTerm();
      while (tokens[pos] === "+" || tokens[pos] === "-") {
        const op = tokens[pos++];
        const right = parseTerm();
        value = op === "+" ? value + right : value - right;
      }
      return value;
    }

    if (!tokens.length) throw new Error("Enter a calculation first.");
    const answer = parseExpression();
    if (pos !== tokens.length) throw new Error("Please check the expression.");
    return Number(formatNumber(answer));
  }

  function fullExpression() {
    let value = expression;
    if (/[+−×÷]$/.test(value)) value += current;
    else if (!value) value = current;
    return value;
  }

  function addHistory(expr, answer) {
    history.unshift({ expr, answer: formatNumber(answer) });
    history = history.slice(0, 8);
    renderHistory();
  }

  function renderHistory() {
    historyList.replaceChildren();
    if (!history.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Your calculations will appear here.";
      historyList.appendChild(empty);
      return;
    }
    history.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-item";
      const expr = document.createElement("span");
      expr.className = "history-expression";
      expr.textContent = item.expr + " =";
      const answer = document.createElement("span");
      answer.className = "history-result";
      answer.textContent = prettyNumber(item.answer);
      button.append(expr, answer);
      button.addEventListener("click", () => {
        current = item.answer;
        expression = item.expr + " =";
        freshEntry = true;
        lastAnswer = Number(item.answer);
        render();
        showMessage("Loaded from history");
      });
      historyList.appendChild(button);
    });
  }

  function equals() {
    const expr = fullExpression();
    try {
      const answer = calculate(expr);
      addHistory(expr, answer);
      current = formatNumber(answer);
      lastAnswer = answer;
      expression = expr + " =";
      freshEntry = true;
      showMessage("Calculation complete");
      render();
    } catch (error) {
      showMessage(error.message || "Unable to calculate.", true);
    }
  }

  function clearAll() {
    current = "0";
    expression = "";
    freshEntry = true;
    showMessage("Ready when you are");
    render();
  }

  function backspace() {
    if (freshEntry) {
      current = "0";
      freshEntry = false;
    } else {
      current = current.length <= 1 || (current.length === 2 && current.startsWith("-"))
        ? "0" : current.slice(0, -1);
    }
    render();
  }

  function unaryAction(action) {
    const n = Number(current);
    let answer;
    let label;
    switch (action) {
      case "sign": answer = -n; label = "Sign changed"; break;
      case "percent": answer = n / 100; label = "Converted to percent"; break;
      case "square": answer = n * n; label = "Squared"; break;
      case "sqrt":
        if (n < 0) { showMessage("Square root needs a non-negative number.", true); return; }
        answer = Math.sqrt(n); label = "Square root calculated"; break;
      case "reciprocal":
        if (n === 0) { showMessage("Zero has no reciprocal.", true); return; }
        answer = 1 / n; label = "Reciprocal calculated"; break;
      case "pi": answer = Math.PI; label = "Pi constant inserted"; break;
      default: return;
    }
    try {
      const formatted = formatNumber(answer);
      const old = current;
      current = formatted;
      expression = action === "pi" ? "π" : action === "square" ? `(${old})²` :
        action === "sqrt" ? `√(${old})` : action === "reciprocal" ? `1 ÷ (${old})` :
        action === "percent" ? `${old}%` : `−(${old})`;
      freshEntry = true;
      showMessage(label);
      render();
      if (action !== "pi") addHistory(expression, answer);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  function handleAction(action) {
    switch (action) {
      case "clear": clearAll(); break;
      case "backspace": backspace(); break;
      case "decimal": inputDecimal(); break;
      case "equals": equals(); break;
      default: unaryAction(action);
    }
  }

  function handleValue(value) {
    if (/^\d$/.test(value)) inputDigit(value);
    else if (value === ".") inputDecimal();
    else if (["+", "−", "×", "÷"].includes(value)) setOperator(value);
  }

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.value !== undefined) handleValue(button.dataset.value);
    else if (button.dataset.action) handleAction(button.dataset.action);
  });

  document.querySelectorAll(".shortcut").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });

  historyToggle.addEventListener("click", () => {
    const willOpen = historyPanel.hidden;
    historyPanel.hidden = !willOpen;
    historyToggle.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) historyPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  clearHistoryButton.addEventListener("click", () => {
    history = [];
    renderHistory();
    notify("Calculation history cleared");
  });

  themeToggle.addEventListener("click", () => {
    const light = document.body.classList.toggle("light-theme");
    themeToggle.textContent = light ? "☾" : "☼";
    themeToggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    document.querySelector('meta[name="theme-color"]').content = light ? "#f1f3f8" : "#10131f";
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const active = document.activeElement;
    if (active && ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(active.tagName) && event.key !== "Enter") return;
    if (/^\d$/.test(event.key)) { inputDigit(event.key); return; }
    if (event.key === ".") { inputDecimal(); return; }
    if (event.key === "+") { setOperator("+"); return; }
    if (event.key === "-") { setOperator("−"); return; }
    if (event.key === "*") { setOperator("×"); return; }
    if (event.key === "/") { event.preventDefault(); setOperator("÷"); return; }
    if (event.key === "Enter" || event.key === "=") { event.preventDefault(); equals(); return; }
    if (event.key === "Backspace") { event.preventDefault(); backspace(); return; }
    if (event.key === "Escape" || event.key === "Delete") { clearAll(); }
    if (event.key === "%") { unaryAction("percent"); }
  });

  document.getElementById("top-link").addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  render();
  renderHistory();
})();
