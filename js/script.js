// Небольшой скрипт: выбор шаблона, сборка промпта и копирование.
const form = document.getElementById("prompt-form");
const goal = document.getElementById("goal");
const output = document.getElementById("prompt-output");
const status = document.getElementById("result-status");
const copyButton = document.getElementById("copy-button");

// ДЗ №5: поиск и категория управляют одним и тем же каталогом из семи карточек.
// Обработчики назначаются один раз; applyFilters() только пересчитывает видимость.
const templateSearch = document.getElementById("template-search");
const templateCategory = document.getElementById("template-category");
const templateCount = document.getElementById("template-count");
const templatesEmpty = document.getElementById("templates-empty");
const templateCards = document.querySelectorAll("#templates .card");
const resetTemplates = document.getElementById("reset-templates");

function applyFilters() {
  const query = templateSearch.value.trim().toLowerCase();
  const category = templateCategory.value;
  let visibleCount = 0;

  templateCards.forEach(function (card) {
    const title = card.querySelector("h3").textContent.toLowerCase();
    const matchesText = title.includes(query);
    const matchesCategory = category === "all" || card.dataset.category === category;
    card.hidden = !(matchesText && matchesCategory);
    if (!card.hidden) visibleCount += 1;
  });

  templateCount.textContent = "Найдено шаблонов: " + visibleCount + " из " + templateCards.length;
  templatesEmpty.hidden = visibleCount !== 0;
}

templateSearch.addEventListener("input", applyFilters);
templateCategory.addEventListener("change", applyFilters);
resetTemplates.addEventListener("click", function () {
  templateSearch.value = "";
  templateCategory.value = "all";
  applyFilters();
  templateSearch.focus();
});
applyFilters();

// Одно нативное модальное окно; содержимое берётся из нажатой карточки.
const templateDialog = document.getElementById("template-details");
const detailsCategory = document.getElementById("template-details-category");
const detailsTitle = document.getElementById("template-details-title");
const detailsSummary = document.getElementById("template-details-summary");
const detailsText = document.getElementById("template-details-text");
const detailsApply = document.getElementById("template-details-apply");
const detailsClose = document.getElementById("template-details-close");
const templateCategoryNames = {
  notes: "Конспекты и резюме",
  analysis: "Разбор материала",
  review: "Повторение"
};
let openedTemplateCard = null;

templateCards.forEach(function (card) {
  card.querySelector(".show-template-details").addEventListener("click", function () {
    openedTemplateCard = card;
    detailsCategory.textContent = templateCategoryNames[card.dataset.category];
    detailsTitle.textContent = card.querySelector("h3").textContent;
    detailsSummary.textContent = card.querySelector(".card-copy p").textContent;
    detailsText.textContent = card.dataset.details;
    templateDialog.showModal();
  });
});

detailsClose.addEventListener("click", function () {
  templateDialog.close();
});
detailsApply.addEventListener("click", function () {
  if (!openedTemplateCard) return;
  const chosenCard = openedTemplateCard;
  templateDialog.close();
  chosenCard.querySelector(".choose-template").click();
});
templateDialog.addEventListener("close", function () {
  openedTemplateCard = null;
});

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
      item.closest(".card").classList.remove("selected");
    });
    button.textContent = "Выбрано";
    button.setAttribute("aria-pressed", "true");
    button.closest(".card").classList.add("selected");

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
