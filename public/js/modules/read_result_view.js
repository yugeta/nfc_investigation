export function showReadJson(ui, result) {
  ui.readResult.textContent = "";
  ui.readResult.textContent = JSON.stringify(result, null, 2);
}

export function showReadErrorMessage(ui, message) {
  ui.readResult.textContent = "";
  ui.readResult.textContent = message;
}
