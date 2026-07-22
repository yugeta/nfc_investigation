export function renderLogSummary(ui, logs) {
  ui.logSummary.textContent = `ログ件数: ${logs.length}`;
}

export function clearLogsAndRender({ ui, logStore }) {
  const logs = logStore.clear();
  renderLogSummary(ui, logs);
}

export function appendLogAndRender({ ui, logStore, eventType, payload }) {
  const logs = logStore.append(eventType, payload);
  renderLogSummary(ui, logs);
}
