import { buildWriteResult } from "./write_payload.js";
import { buildWriteRequest } from "./write_request_builder.js";
import { runWriteVerifyFlow } from "./write_verify_flow.js";
import {
  showWriteActionError,
  showWriteSuccessPendingVerify,
  showWriteValidationMessage,
  showWriteWaiting
} from "./write_result_view.js";

export class WriteFlow {
  constructor({
    ui,
    nfcController,
    state,
    ensureCompatibilityFor,
    renderNfcState,
    stopScan,
    formatNfcError,
    appendLog,
    syncDraftFromReadResult
  }) {
    this.ui = ui;
    this.nfcController = nfcController;
    this.state = state;
    this.ensureCompatibilityFor = ensureCompatibilityFor;
    this.renderNfcState = renderNfcState;
    this.stopScan = stopScan;
    this.formatNfcError = formatNfcError;
    this.appendLog = appendLog;
    this.syncDraftFromReadResult = syncDraftFromReadResult;
  }

  async handleWrite() {
    if (!this.ensureCompatibilityFor(this.ui.writeResult)) {
      return;
    }

    if (this.state.isWriting) {
      return;
    }

    if (this.state.isScanning) {
      this.stopScan();
    }

    const request = buildWriteRequest(this.ui);
    if (!request.ok) {
      showWriteValidationMessage(this.ui, request.message);
      return;
    }
    const { payload, records } = request;

    try {
      this.state.setWriting(true);
      this.renderNfcState();
      showWriteWaiting(this.ui);
      const preWriteSnapshot = this.state.lastReadSnapshot;

      await this.nfcController.writeRecords(records);
      const writeResult = buildWriteResult(payload, records);
      showWriteSuccessPendingVerify(this.ui, writeResult);
      this.appendLog("write", writeResult);
      await runWriteVerifyFlow({
        nfcController: this.nfcController,
        state: this.state,
        payload,
        preWriteSnapshot,
        writeResult,
        ui: this.ui,
        syncDraftFromReadResult: this.syncDraftFromReadResult,
        appendLog: this.appendLog
      });
    } catch (error) {
      showWriteActionError(this.ui, this.formatNfcError(error, "書き込み"));
    } finally {
      this.state.setWriting(false);
      this.renderNfcState();
    }
  }
}
