// Небольшой скрипт: выбор шаблона, сборка промпта и копирование.
const form = document.getElementById("prompt-form");
const goal = document.getElementById("goal");
const output = document.getElementById("prompt-output");
const status = document.getElementById("result-status");
const copyButton = document.getElementById("copy-button");

// Выбор шаблона заполняет поля формы готовыми параметрами.
document.querySelectorAll(".choose-template").forEach(function (button) {
  button.addEventListener("click", function () {
    goal.value = button.dataset.goal;
    document.getElementById("detail").value = button.dataset.detail;
    document.getElementById("extra").value = button.dataset.extra || "Без дополнительных разделов";
    document.getElementById("formulas").checked = button.dataset.formulas === "true";
    document.getElementById("terms").checked = button.dataset.terms === "true";
    document.getElementById("homework").checked = button.dataset.homework === "true";
    document.getElementById("questions").checked = button.dataset.questions === "true";

    // Показываем, какая карточка выбрана.
    document.querySelectorAll(".choose-template").forEach(function (item) {
      item.textContent = "Выбрать";
      item.setAttribute("aria-pressed", "false");
      item.parentElement.classList.remove("selected");
    });
    button.textContent = "Выбрано";
    button.setAttribute("aria-pressed", "true");
    button.parentElement.classList.add("selected");

    const message = "Применён шаблон «" + goal.value + "». Выбери тип материала, проверь параметры и сформируй промпт.";
    document.getElementById("builder-message").textContent = message;
    document.getElementById("builder-message").classList.add("is-visible");
    clearResult();
    document.getElementById("builder").scrollIntoView();
  });
});

// После изменения параметров старый промпт больше не считается актуальным.
function clearResult() {
  output.value = "";
  copyButton.disabled = true;
  status.textContent = "Настройки изменены. Сформируй промпт заново.";
}
form.addEventListener("change", clearResult);

// Понятные правила для каждой учебной цели.
const instructions = {
  "Подробный конспект": "Раздели материал на темы, сохрани важные определения и примеры.",
  "Краткое резюме": "Коротко перечисли главные идеи без лишних подробностей.",
  "Термины и определения": "Перечисли основные термины и дай их определения.",
  "Формулы и алгоритмы": "Выпиши формулы, поясни обозначения и порядок действий.",
  "Домашнее задание": "Найди задания, требования и сроки, если они названы.",
  "Карточки Anki": "Составь карточки для повторения в формате «вопрос — ответ».",
  "Самопроверка": "Составь вопросы для проверки знаний и правильные ответы к ним."
};

// Получаем значения формы и собираем из них обычный текст.
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Не перезагружать страницу.

  let text = "Подготовь ответ по приложенному учебному материалу.\n";
  text += "Тип материала: " + document.getElementById("material").value + ".\n";
  text += "Цель: " + goal.value + ".\n";
  text += instructions[goal.value] + "\n";
  text += "Язык: " + document.getElementById("language").value + ".\n";
  text += "Подробность: " + document.getElementById("detail").value + ".\n";
  text += "Работа с источником: " + document.getElementById("source-mode").value + ".\n";
  const extra = document.getElementById("extra").value;
  if (extra !== "Без дополнительных разделов") {
    text += "Добавь раздел: " + extra + ".\n";
  }

  if (document.getElementById("formulas").checked) text += "Сохрани формулы.\n";
  if (document.getElementById("terms").checked) text += "Выдели определения.\n";
  if (document.getElementById("homework").checked) text += "Выдели домашнее задание.\n";
  if (document.getElementById("questions").checked) text += "Добавь вопросы для самопроверки.\n";
  text += "Не придумывай факты, которых нет в источнике. Укажи, если данных недостаточно.";

  output.value = text;
  copyButton.disabled = false;
  status.textContent = "Промпт готов. Можно копировать.";
  document.getElementById("result").scrollIntoView();
});

// Копируем текст в буфер обмена.
copyButton.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(output.value);
    status.textContent = "Промпт скопирован! Не забудь прикрепить учебный файл в нейросети.";
  } catch {
    output.select();
    status.textContent = "Копирование недоступно. Текст выделен — нажми Ctrl+C.";
  }
});

// Отображаем только имя выбранного локального файла (не читаем и не отправляем его).
document.getElementById("source-file").addEventListener("change", function (event) {
  const file = event.target.files[0];
  document.getElementById("file-name").textContent = file
    ? "Выбран: " + file.name + ". Не забудь приложить файл во внешней нейросети."
    : "Файл не выбран. Приложи источник к запросу во внешней нейросети.";
});


// ДЗ №5. Поиск и категория — единый пересчёт списка шаблонов.
const templateSearch = document.querySelector("#template-search");
const templateCategory = document.querySelector("#template-category");
const templateCards = document.querySelectorAll("#templates .card");
const templateCount = document.querySelector("#template-count");
const templateEmpty = document.querySelector("#template-empty");
const resetTemplateFilters = document.querySelector("#reset-template-filters");

function normalizeSearchText(text) {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru");
}

function applyFilters() {
  const query = normalizeSearchText(templateSearch.value);
  const category = templateCategory.value;
  let visibleCount = 0;
  templateCards.forEach((card) => {
    const title = normalizeSearchText(card.querySelector("h3").textContent);
    const matchesText = title.includes(query);
    const matchesCategory = category === "all" || card.dataset.category === category;
    card.hidden = !(matchesText && matchesCategory);
    if (!card.hidden) visibleCount += 1;
  });
  templateCount.textContent = `Найдено: ${visibleCount}`;
  templateEmpty.hidden = visibleCount !== 0;
}
templateSearch.addEventListener("input", applyFilters);
templateCategory.addEventListener("change", applyFilters);
resetTemplateFilters.addEventListener("click", () => {
  templateSearch.value = "";
  templateCategory.value = "all";
  applyFilters();
  templateSearch.focus();
});
applyFilters();

// ДЗ №5. Одно нативное модальное окно для подробностей всех семи шаблонов.
const templateDialog = document.querySelector("#template-dialog");
const templateDialogTitle = document.querySelector("#template-dialog-title");
const templateDialogDescription = document.querySelector("#template-dialog-description");
const templateDialogCategory = document.querySelector("#template-dialog-category");
const categoryNames = { notes: "Конспекты", study: "Изучение материала", practice: "Практика и проверка" };
templateCards.forEach((card) => {
  card.querySelector(".template-details").addEventListener("click", () => {
    templateDialogTitle.textContent = card.querySelector("h3").textContent;
    templateDialogDescription.textContent = card.querySelector(".card-copy p").textContent;
    templateDialogCategory.textContent = "Категория: " + (categoryNames[card.dataset.category] || "Без категории");
    templateDialog.showModal();
  });
});
document.querySelector("#close-template-dialog").addEventListener("click", () => templateDialog.close());

// Нативный dialog блокирует фон, но Tab на границе может уйти в интерфейс браузера.
// Замыкаем цикл на доступных элементах окна, сохраняя стандартное закрытие Escape.
templateDialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const controls = Array.from(templateDialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (first && ((event.shiftKey && document.activeElement === first) ||
      (!event.shiftKey && document.activeElement === last))) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
});
