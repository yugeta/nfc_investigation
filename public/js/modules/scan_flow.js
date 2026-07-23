import { runScanStartFlow } from "./scan_start_flow.js";
import { buildScanToggleRequest } from "./scan_toggle_request_builder.js";

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
    const request = buildScanToggleRequest({
      ui: this.ui,
      state: this.state,
      ensureCompatibilityFor: this.ensureCompatibilityFor
    });

    if (!request.ok) {
      return;
    }

    if (request.action === "stop") {
      this.stop();
      return;
    }

    await runScanStartFlow({
      ui: this.ui,
      nfcController: this.nfcController,
      state: this.state,
      renderNfcState: this.renderNfcState,
      formatNfcError: this.formatNfcError,
      stop: () => this.stop(),
      onReadResult: this.onReadResult
    });
  }
}
