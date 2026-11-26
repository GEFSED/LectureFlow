// Небольшой скрипт: выбор шаблона, сборка промпта и копирование.
const form = document.getElementById("prompt-form");
const goal = document.getElementById("goal");
const output = document.getElementById("prompt-output");
const status = document.getElementById("result-status");
const copyButton = document.getElementById("copy-button");

// Выбор шаблона заполняет поля формы готовыми параметрами.
// ДЗ № 6: карточки появляются после fetch(), поэтому обработчик вызывается делегированно.
function chooseTemplate(item) {
  const preset = item.preset;
  goal.value = preset.goal;
  document.getElementById("detail").value = preset.detail;
  document.getElementById("extra").value = preset.extra;
  for (const key of ["formulas", "terms", "homework", "questions"]) {
    document.getElementById(key).checked = preset[key];
  }
  selectedId = item.id;
  applyFilters();
  const message = document.getElementById("builder-message");
  message.textContent = "Применён шаблон «" + goal.value + "». Выбери тип материала, проверь параметры и сформируй промпт.";
  message.classList.add("is-visible");
  clearResult();
  document.getElementById("material").focus({ preventScroll: true });
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
let allCards = [];
let selectedId = null;

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
  const visible = allCards.filter((item) =>
    normalizeSearchText(item.title).includes(query) &&
    (category === "all" || item.category === category)
  );
  renderCards(visible);
  templateCount.textContent = `Найдено: ${visible.length}`;
  templateEmpty.hidden = visible.length !== 0;
  templateEmpty.textContent = allCards.length
    ? "Ничего не найдено. Измени запрос или категорию."
    : "В источнике пока нет шаблонов.";
}

function renderCards(items) {
  const fragment = document.createDocumentFragment();
  for (const item of items) fragment.append(createTemplateCard(item));
  templateCardsContainer.replaceChildren(fragment);
}

// Проверяем формат, чтобы неполные данные не создали сломанные карточки.
function validateTemplates(data) {
  if (!Array.isArray(data)) throw new Error("В файле данных ожидался массив шаблонов.");
  const ids = new Set();
  for (const item of data) {
    if (!item || !Number.isInteger(item.id) || ids.has(item.id) ||
        typeof item.title !== "string" || !item.title.trim() ||
        typeof item.category !== "string" || !Object.hasOwn(categoryNames, item.category) ||
        typeof item.description !== "string" || !item.description.trim() ||
        !Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== "string") ||
        typeof item.icon !== "string" || !item.icon.trim() ||
        (item.image !== null && typeof item.image !== "string") ||
        (item.link !== null && typeof item.link !== "string") ||
        !item.preset || ["goal", "detail", "extra"].some((key) =>
          !Array.from(document.getElementById(key).options).some((option) =>
            option.value && option.value === item.preset[key])) ||
        ["formulas", "terms", "homework", "questions"].some((key) => typeof item.preset[key] !== "boolean")) {
      throw new Error("Нарушена структура данных шаблона. Проверь поля карточек и уникальность ID.");
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
  const selected = item.id === selectedId;
  card.classList.toggle("selected", selected);
  chooseButton.textContent = selected ? "Выбрано" : "Выбрать";
  chooseButton.setAttribute("aria-pressed", String(selected));

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
  const button = event.target.closest(".choose-template, .template-details");
  if (!button || !templateCardsContainer.contains(button)) return;
  const id = button.closest(".card")?.dataset.templateId;
  const item = allCards.find((entry) => String(entry.id) === id);
  if (!item) return;
  if (button.matches(".choose-template")) {
    chooseTemplate(item);
  } else {
    templateDialogTitle.textContent = item.title;
    templateDialogDescription.textContent = item.description;
    templateDialogCategory.textContent = "Категория: " + categoryNames[item.category];
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
  allCards = [];
  try {
    const response = await fetch("data/data.json");
    if (!response.ok) throw new Error(`Сервер вернул HTTP ${response.status} при загрузке шаблонов.`);
    allCards = validateTemplates(await response.json());
    templateControls.forEach((control) => { control.disabled = allCards.length === 0; });
    applyFilters();
  } catch (error) {
    templateCount.textContent = "Шаблоны недоступны";
    let reason = error.message;
    if (error instanceof SyntaxError) reason = "Файл шаблонов содержит некорректный JSON.";
    if (error instanceof TypeError) reason = "Не удалось получить данные. Проверь соединение с сервером.";
    if (location.protocol === "file:") reason = "Открой страницу через Live Server или другой HTTP-сервер.";
    templateLoadErrorText.textContent = reason + " Затем нажми «Повторить загрузку».";
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
