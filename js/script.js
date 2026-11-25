// Небольшой скрипт: выбор шаблона, сборка промпта и копирование.
const form = document.getElementById("prompt-form");
const goal = document.getElementById("goal");
const output = document.getElementById("prompt-output");
const status = document.getElementById("result-status");
const copyButton = document.getElementById("copy-button");

// Выбор шаблона заполняет поля формы готовыми параметрами.
// ДЗ № 6: карточки появляются после fetch(), поэтому обработчик вызывается делегированно.
function chooseTemplate(button) {
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
}

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



// ДЗ № 6. Модели карточек хранятся в JSON, а не в HTML.
const templateSearch = document.querySelector("#template-search");
const templateCategory = document.querySelector("#template-category");
const templateCardsContainer = document.querySelector("#template-cards");
const templateCount = document.querySelector("#template-count");
const templateEmpty = document.querySelector("#template-empty");
const templateLoading = document.querySelector("#template-loading");
const templateLoadError = document.querySelector("#template-load-error");
const templateLoadErrorText = document.querySelector("#template-load-error-text");
const retryTemplateLoad = document.querySelector("#retry-template-load");
const resetTemplateFilters = document.querySelector("#reset-template-filters");
const templateControls = [templateSearch, templateCategory, resetTemplateFilters];
let templateCards = [];

const templateDialog = document.querySelector("#template-dialog");
const templateDialogTitle = document.querySelector("#template-dialog-title");
const templateDialogDescription = document.querySelector("#template-dialog-description");
const templateDialogCategory = document.querySelector("#template-dialog-category");
const categoryNames = { notes: "Конспекты", study: "Изучение материала", practice: "Практика и проверка" };

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

// Проверяем формат, чтобы неполные данные не создали сломанные карточки.
function validateTemplates(data) {
  if (!Array.isArray(data) || data.length < 6) {
    throw new Error("JSON: ожидался массив минимум из шести карточек");
  }
  const ids = new Set();
  for (const item of data) {
    if (!item || !Number.isInteger(item.id) || ids.has(item.id) ||
        typeof item.title !== "string" || !item.title.trim() ||
        !Object.hasOwn(categoryNames, item.category) ||
        typeof item.description !== "string" || !item.description.trim() ||
        !Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== "string") ||
        typeof item.icon !== "string" || !item.icon.trim() ||
        (item.image !== null && typeof item.image !== "string") ||
        (item.link !== null && typeof item.link !== "string") ||
        !item.preset || typeof item.preset.goal !== "string" ||
        typeof item.preset.detail !== "string" || typeof item.preset.extra !== "string" ||
        ["formulas", "terms", "homework", "questions"].some((key) => typeof item.preset[key] !== "boolean")) {
      throw new Error("JSON: нарушена структура карточки");
    }
    ids.add(item.id);
  }
  return data;
}

// Все подписи записываются через textContent, без вставки HTML из JSON.
function createTemplateCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.category = item.category;
  card.dataset.templateId = String(item.id);

  const top = document.createElement("div");
  top.className = "card-top";
  const icon = document.createElement("span");
  icon.className = "card-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = item.icon;
  const copy = document.createElement("div");
  copy.className = "card-copy";
  const title = document.createElement("h3");
  title.textContent = item.title;
  const description = document.createElement("p");
  description.textContent = item.description;
  copy.append(title, description);
  top.append(icon, copy);

  const tags = document.createElement("div");
  tags.className = "card-tags";
  tags.setAttribute("aria-label", "Темы шаблона");
  for (const tag of item.tags) {
    const tagSpan = document.createElement("span");
    tagSpan.textContent = tag;
    tags.append(tagSpan);
  }

  const chooseButton = document.createElement("button");
  chooseButton.className = "choose-template";
  chooseButton.type = "button";
  chooseButton.textContent = "Выбрать";
  chooseButton.setAttribute("aria-pressed", "false");
  chooseButton.dataset.goal = item.preset.goal;
  chooseButton.dataset.detail = item.preset.detail;
  chooseButton.dataset.extra = item.preset.extra;
  for (const key of ["formulas", "terms", "homework", "questions"]) {
    chooseButton.dataset[key] = String(item.preset[key]);
  }

  const detailsButton = document.createElement("button");
  detailsButton.className = "template-details";
  detailsButton.type = "button";
  detailsButton.textContent = "Подробнее";
  detailsButton.setAttribute("aria-label", `Подробнее о шаблоне «${item.title}»`);
  card.append(top, tags, chooseButton, detailsButton);
  return card;
}

// Событие назначается контейнеру один раз, независимо от количества загрузок.
templateCardsContainer.addEventListener("click", (event) => {
  const chooseButton = event.target.closest(".choose-template");
  if (chooseButton && templateCardsContainer.contains(chooseButton)) {
    chooseTemplate(chooseButton);
    return;
  }
  const detailsButton = event.target.closest(".template-details");
  if (detailsButton && templateCardsContainer.contains(detailsButton)) {
    const card = detailsButton.closest(".card");
    templateDialogTitle.textContent = card.querySelector("h3").textContent;
    templateDialogDescription.textContent = card.querySelector(".card-copy p").textContent;
    templateDialogCategory.textContent = "Категория: " + categoryNames[card.dataset.category];
    templateDialog.showModal();
  }
});

async function loadTemplates() {
  templateLoading.hidden = false;
  templateLoadError.hidden = true;
  templateEmpty.hidden = true;
  templateCount.textContent = "Загрузка…";
  templateControls.forEach((control) => { control.disabled = true; });
  templateCardsContainer.setAttribute("aria-busy", "true");
  templateCardsContainer.replaceChildren();
  templateCards = [];
  try {
    const response = await fetch("data/data.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = validateTemplates(await response.json());
    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(createTemplateCard(item)));
    templateCardsContainer.replaceChildren(fragment);
    templateCards = Array.from(templateCardsContainer.querySelectorAll(".card"));
    templateControls.forEach((control) => { control.disabled = false; });
    applyFilters();
  } catch (error) {
    templateCount.textContent = "Шаблоны недоступны";
    templateLoadErrorText.textContent = location.protocol === "file:"
      ? "Открой страницу через Live Server (HTTP): браузер не может загрузить JSON из локального файла."
      : "Не удалось загрузить шаблоны. Проверь соединение и нажми «Повторить загрузку».";
    templateLoadError.hidden = false;
    console.warn("Не удалось загрузить шаблоны:", error.message);
  } finally {
    templateLoading.hidden = true;
    templateCardsContainer.setAttribute("aria-busy", "false");
  }
}

templateSearch.addEventListener("input", applyFilters);
templateCategory.addEventListener("change", applyFilters);
resetTemplateFilters.addEventListener("click", () => {
  templateSearch.value = "";
  templateCategory.value = "all";
  applyFilters();
  templateSearch.focus();
});
retryTemplateLoad.addEventListener("click", loadTemplates);
loadTemplates();

// ДЗ № 5: сохранено одно модальное окно, закрытие по Escape и удержание фокуса.
document.querySelector("#close-template-dialog").addEventListener("click", () => templateDialog.close());
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
