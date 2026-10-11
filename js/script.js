// Небольшой скрипт: выбор шаблона, сборка промпта и копирование.
const form = document.getElementById("prompt-form");
const goal = document.getElementById("goal");
const output = document.getElementById("prompt-output");
const status = document.getElementById("result-status");
const copyButton = document.getElementById("copy-button");

// При выборе карточки меняем цель в форме.
document.querySelectorAll(".choose-template").forEach(function (button) {
  button.addEventListener("click", function () {
    goal.value = button.dataset.goal;
    document.getElementById("template-message").textContent = "Выбран шаблон: " + goal.value;
    document.getElementById("builder").scrollIntoView();
  });
});

// Получаем значения формы и собираем из них обычный текст.
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Не перезагружать страницу.

  let text = "Подготовь ответ по приложенному учебному материалу.\n";
  text += "Тип материала: " + document.getElementById("material").value + ".\n";
  text += "Цель: " + goal.value + ".\n";
  text += "Язык: " + document.getElementById("language").value + ".\n";
  text += "Подробность: " + document.getElementById("detail").value + ".\n";
  text += "Работа с источником: " + document.getElementById("source-mode").value + ".\n";
  text += "Дополнительные разделы: " + document.getElementById("extra").value + ".\n";

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