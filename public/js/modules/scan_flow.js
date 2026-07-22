import { showReadErrorMessage, showReadJson } from "./read_result_view.js";

export class ScanFlow {
  constructor({ ui, nfcController, state, ensureCompatibilityFor, renderNfcState, formatNfcError, onReadResult }) {
    this.ui = ui;
    this.nfcController = nfcController;
    this.state = state;
    this.ensureCompatibilityFor = ensureCompatibilityFor;
    this.renderNfcState = renderNfcState;
    this.formatNfcError = formatNfcError;
    this.onReadResult = onReadResult;
  }

  stop() {
    this.nfcController.stopScan();
    this.state.setScanning(false);
    this.renderNfcState();
  }

  async handleToggle() {
    if (!this.ensureCompatibilityFor(this.ui.readResult)) {
      return;
    }

    if (this.state.isScanning) {
      this.stop();
      return;
    }

    try {
      await this.nfcController.startScan(
        (result) => {
          showReadJson(this.ui, result);
          this.state.updateLastReadSnapshot("read", result);
          this.onReadResult(result);
        },
        (error) => {
          showReadErrorMessage(this.ui, error.message);
        }
      );

      this.state.setScanning(true);
      this.renderNfcState();
    } catch (error) {
      showReadErrorMessage(this.ui, this.formatNfcError(error, "読み取り"));
      this.stop();
    }
  }
}
