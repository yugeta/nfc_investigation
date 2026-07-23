import { showReadErrorMessage, showReadJson } from "./read_result_view.js";

export async function runScanStartFlow({
  ui,
  nfcController,
  state,
  renderNfcState,
  formatNfcError,
  stop,
  onReadResult
}) {
  try {
    await nfcController.startScan(
      (result) => {
        showReadJson(ui, result);
        state.updateLastReadSnapshot("read", result);
        onReadResult(result);
      },
      (error) => {
        showReadErrorMessage(ui, error.message);
      }
    );

    state.setScanning(true);
    renderNfcState();
  } catch (error) {
    showReadErrorMessage(ui, formatNfcError(error, "読み取り"));
    stop();
  }
}
