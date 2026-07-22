import { CompatibilityChecker } from "./compatibility_checker.js";
import { applyCompatibilityToUi, applyIncompatibleMessage } from "./compatibility_view.js";
import { bindUiEvents } from "./event_binders.js";
import { appendLogAndRender, clearLogsAndRender, renderLogSummary } from "./log_actions.js";
import { LogStore } from "./log_store.js";
import { NfcController } from "./nfc_controller.js";
import { renderNfcState as renderNfcUiState } from "./nfc_state_view.js";
import { formatNfcError } from "./nfc_utils.js";
import { NfcRuntimeState } from "./nfc_runtime_state.js";
import { ScanFlow } from "./scan_flow.js";
import { UiElements } from "./ui_elements.js";
import { loadWriteDraft, persistWriteDraftFromInputs, applyWriteDraftToInputs } from "./write_draft_store.js";
import { WriteFlow } from "./write_flow.js";
import { syncWriteDraftFromReadResult } from "./read_write_draft_sync.js";

export class Init {
  static instance;

  static getInstance() {
    if (!Init.instance) {
      Init.instance = new Init();
    }
    return Init.instance;
  }

  constructor() {
    this.ui = UiElements.getInstance();
    this.compatibilityChecker = CompatibilityChecker.getInstance();
    this.logStore = LogStore.getInstance();
    this.nfcController = NfcController.getInstance();
    this.state = new NfcRuntimeState();

    this.scanFlow = new ScanFlow({
      ui: this.ui,
      nfcController: this.nfcController,
      state: this.state,
      ensureCompatibilityFor: (targetElement) => this.ensureCompatibilityFor(targetElement),
      renderNfcState: () => this.renderNfcState(),
      formatNfcError,
      onReadResult: (result) => this.handleReadResult(result)
    });

    this.writeFlow = new WriteFlow({
      ui: this.ui,
      nfcController: this.nfcController,
      state: this.state,
      ensureCompatibilityFor: (targetElement) => this.ensureCompatibilityFor(targetElement),
      renderNfcState: () => this.renderNfcState(),
      stopScan: () => this.scanFlow.stop(),
      formatNfcError,
      appendLog: (eventType, payload) => this.appendLog(eventType, payload),
      syncDraftFromReadResult: (readResult) => this.syncDraftFromReadResult(readResult)
    });
  }

  init() {
    this.bindEvents();
    renderLogSummary(this.ui, this.logStore.load());
    applyWriteDraftToInputs(this.ui, loadWriteDraft());
    this.refreshCompatibilityState();
    this.renderNfcState();
  }

  bindEvents() {
    bindUiEvents(this.ui, {
      onExportLogs: () => this.logStore.exportAsJson(),
      onClearLogs: () => clearLogsAndRender({ ui: this.ui, logStore: this.logStore }),
      onToggleScan: async () => {
        await this.scanFlow.handleToggle();
      },
      onWrite: async () => {
        await this.writeFlow.handleWrite();
      },
      onWriteTextInput: () => persistWriteDraftFromInputs(this.ui),
      onWriteUriInput: () => persistWriteDraftFromInputs(this.ui)
    });
  }

  handleReadResult(result) {
    this.syncDraftFromReadResult(result);
    this.appendLog("read", result);
  }

  syncDraftFromReadResult(readResult) {
    return syncWriteDraftFromReadResult(this.ui, readResult);
  }

  refreshCompatibilityState() {
    const compatibility = applyCompatibilityToUi({
      ui: this.ui,
      compatibilityChecker: this.compatibilityChecker
    });

    this.state.setCompatibility(compatibility.isCompatible, compatibility.compatibilityMessage);
  }

  ensureCompatibilityFor(targetElement) {
    this.refreshCompatibilityState();
    this.renderNfcState();

    if (this.state.isCompatible) {
      return true;
    }

    applyIncompatibleMessage(targetElement, this.state.compatibilityMessage);
    return false;
  }

  renderNfcState() {
    renderNfcUiState(this.ui, {
      isCompatible: this.state.isCompatible,
      isWriting: this.state.isWriting,
      isScanning: this.state.isScanning
    });
  }

  appendLog(eventType, payload) {
    appendLogAndRender({
      ui: this.ui,
      logStore: this.logStore,
      eventType,
      payload
    });
  }
}
