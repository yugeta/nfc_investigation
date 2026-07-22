export function bindUiEvents(ui, handlers) {
  ui.exportLogsButton.addEventListener("click", handlers.onExportLogs);
  ui.clearLogsButton.addEventListener("click", handlers.onClearLogs);
  ui.startScanButton.addEventListener("click", handlers.onToggleScan);
  ui.writeButton.addEventListener("click", handlers.onWrite);
  ui.writeText.addEventListener("input", handlers.onWriteTextInput);
  ui.writeUri.addEventListener("input", handlers.onWriteUriInput);
}
