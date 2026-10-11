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
