export function renderNfcState(ui, state) {
  const { isCompatible, isWriting, isScanning } = state;

  if (!isCompatible) {
    ui.startScanButton.disabled = true;
    ui.writeButton.disabled = true;
    ui.writeText.disabled = true;
    ui.writeUri.disabled = true;
    return;
  }

  if (isWriting) {
    ui.startScanButton.disabled = true;
    ui.writeButton.disabled = true;
    ui.startScanButton.textContent = "読み取り開始";
    ui.writeText.disabled = true;
    ui.writeUri.disabled = true;
    return;
  }

  if (isScanning) {
    ui.startScanButton.disabled = false;
    ui.writeButton.disabled = true;
    ui.startScanButton.textContent = "読み取り停止";
    ui.writeText.disabled = true;
    ui.writeUri.disabled = true;
    return;
  }

  ui.startScanButton.disabled = false;
  ui.writeButton.disabled = false;
  ui.startScanButton.textContent = "読み取り開始";
  ui.writeText.disabled = false;
  ui.writeUri.disabled = false;
}
