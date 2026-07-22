import { CompatibilityChecker } from "./compatibility_checker.js";
import { LogStore } from "./log_store.js";
import { NfcController } from "./nfc_controller.js";
import { formatNfcError } from "./nfc_utils.js";
import { UiElements } from "./ui_elements.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function extractComparableValues(records) {
  return records
    .map((record) => normalizeText(record.value))
    .filter((value) => value.length > 0);
}

function normalizeUri(value) {
  return String(value || "").trim();
}

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

    this.isCompatible = false;
    this.isScanning = false;
    this.isWriting = false;
    this.lastReadSnapshot = null;
  }

  init() {
    this.bindEvents();
    this.renderLogSummary(this.logStore.load());
    this.applyCompatibility();
    this.renderNfcState();
    this.renderWriteMode();
  }

  bindEvents() {
    this.ui.exportLogsButton.addEventListener("click", () => {
      this.logStore.exportAsJson();
    });

    this.ui.clearLogsButton.addEventListener("click", () => {
      const logs = this.logStore.clear();
      this.renderLogSummary(logs);
    });

    this.ui.startScanButton.addEventListener("click", async () => {
      await this.handleScanToggle();
    });

    this.ui.writeButton.addEventListener("click", async () => {
      await this.handleWrite();
    });

    this.ui.writeModeText.addEventListener("change", () => {
      this.renderWriteMode();
    });

    this.ui.writeModeUri.addEventListener("change", () => {
      this.renderWriteMode();
    });
  }

  getSelectedWriteMode() {
    return this.ui.writeModeUri.checked ? "uri" : "text";
  }

  renderWriteMode() {
    const mode = this.getSelectedWriteMode();
    const controlsBlocked = !this.isCompatible || this.isWriting || this.isScanning;

    this.ui.writeModeText.disabled = controlsBlocked;
    this.ui.writeModeUri.disabled = controlsBlocked;

    this.ui.writeText.disabled = controlsBlocked || mode !== "text";
    this.ui.writeUri.disabled = controlsBlocked || mode !== "uri";
  }

  applyCompatibility() {
    const result = this.compatibilityChecker.evaluate();

    this.ui.statusSecureContext.textContent = `Secure Context: ${result.isSecure ? "OK" : "NG"}`;
    this.ui.statusNdefApi.textContent = `Web NFC API: ${result.hasNdefReader ? "OK" : "NG"}`;

    this.isCompatible = result.ok;
    if (!result.ok) {
      this.ui.compatibilityError.hidden = false;
      this.ui.compatibilityError.textContent = result.message;
      return;
    }

    this.ui.compatibilityError.hidden = true;
    this.ui.compatibilityError.textContent = "";
  }

  renderNfcState() {
    if (!this.isCompatible) {
      this.ui.startScanButton.disabled = true;
      this.ui.writeButton.disabled = true;
      this.renderWriteMode();
      return;
    }

    if (this.isWriting) {
      this.ui.startScanButton.disabled = true;
      this.ui.writeButton.disabled = true;
      this.ui.startScanButton.textContent = "読み取り開始";
      this.renderWriteMode();
      return;
    }

    if (this.isScanning) {
      this.ui.startScanButton.disabled = false;
      this.ui.writeButton.disabled = true;
      this.ui.startScanButton.textContent = "読み取り停止";
      this.renderWriteMode();
      return;
    }

    this.ui.startScanButton.disabled = false;
    this.ui.writeButton.disabled = false;
    this.ui.startScanButton.textContent = "読み取り開始";
    this.renderWriteMode();
  }

  renderLogSummary(logs) {
    this.ui.logSummary.textContent = `ログ件数: ${logs.length}`;
  }

  appendLog(eventType, payload) {
    const logs = this.logStore.append(eventType, payload);
    this.renderLogSummary(logs);
  }

  updateLastReadSnapshot(source, readResult) {
    this.lastReadSnapshot = {
      source,
      serialNumber: readResult.serialNumber,
      records: readResult.records,
      at: readResult.readAt || new Date().toISOString()
    };
  }

  stopScan() {
    this.nfcController.stopScan();
    this.isScanning = false;
    this.renderNfcState();
  }

  async handleScanToggle() {
    if (!this.isCompatible) {
      this.ui.readResult.textContent = "このブラウザはWeb NFCに未対応です。";
      return;
    }

    if (this.isScanning) {
      this.stopScan();
      this.ui.readResult.textContent = "読み取りを停止しました。";
      return;
    }

    try {
      await this.nfcController.startScan(
        (result) => {
          this.ui.readResult.textContent = JSON.stringify(result, null, 2);
          this.updateLastReadSnapshot("read", result);
          this.appendLog("read", result);
        },
        (error) => {
          this.ui.readResult.textContent = error.message;
        }
      );

      this.isScanning = true;
      this.renderNfcState();
      this.ui.readResult.textContent = "スキャン開始。タグをかざしてください。";
    } catch (error) {
      this.ui.readResult.textContent = formatNfcError(error, "読み取り");
      this.stopScan();
    }
  }

  async handleWrite() {
    if (!this.isCompatible) {
      this.ui.writeResult.textContent = "このブラウザはWeb NFCに未対応です。";
      return;
    }

    if (this.isWriting) {
      return;
    }

    if (this.isScanning) {
      this.stopScan();
      this.ui.readResult.textContent = "書き込みのため、読み取りを停止しました。";
    }

    const mode = this.getSelectedWriteMode();
    const text = this.ui.writeText.value.trim();
    const uri = this.ui.writeUri.value.trim();

    if (mode === "text" && !text) {
      this.ui.writeResult.textContent = "書き込むテキストを入力してください。";
      return;
    }

    if (mode === "uri" && !uri) {
      this.ui.writeResult.textContent = "書き込むURIを入力してください。";
      return;
    }

    if (mode === "uri") {
      try {
        // URL constructor validates absolute URI format.
        new URL(uri);
      } catch (_) {
        this.ui.writeResult.textContent = "URI形式が不正です。https://から始まる形式を入力してください。";
        return;
      }
    }

    try {
      this.isWriting = true;
      this.renderNfcState();
      this.ui.writeResult.textContent = "書き込み待機中です。タグを端末にかざしてください。";
      const preWriteSnapshot = this.lastReadSnapshot;

      const writeResult = mode === "text"
        ? await this.nfcController.writeText(text)
        : await this.nfcController.writeUri(uri);
      this.ui.writeResult.textContent =
        `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n読み取り確認中...`;
      this.appendLog("write", writeResult);

      try {
        const verifyResult = await this.nfcController.readBackOnce();
        this.updateLastReadSnapshot("write_verify", verifyResult);

        const expectedValue = mode === "text" ? normalizeText(text) : normalizeUri(uri);
        const comparableValues = extractComparableValues(verifyResult.records);
        const isVerified = comparableValues.includes(expectedValue);
        const serialChanged =
          !!preWriteSnapshot?.serialNumber &&
          preWriteSnapshot.serialNumber !== verifyResult.serialNumber;

        const verifySummary = {
          verified: isVerified,
          expectedType: mode,
          expectedValue,
          detectedComparableValues: comparableValues,
          detectedRecords: verifyResult.records,
          verifyReadAt: verifyResult.readAt,
          serialNumber: verifyResult.serialNumber,
          previousSerialNumber: preWriteSnapshot?.serialNumber || null,
          serialChanged
        };

        if (isVerified) {
          this.ui.writeResult.textContent =
            `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n` +
            `読み取り確認: OK\n${JSON.stringify(verifySummary, null, 2)}`;
        } else {
          const reasons = [];
          if (serialChanged) {
            reasons.push("- 読み取り確認時のタグが別タグの可能性があります（serialNumberが変化）。");
          }
          if (comparableValues.length === 0) {
            reasons.push("- 読み取れたレコードに比較可能な文字列がありません。タグ形式が想定外の可能性があります。");
          }
          reasons.push("- タグが書き込み不可（ロック済み/権限制約）の可能性があります。");
          reasons.push("- 書き込み後に同じタグを十分近づけていない可能性があります。");

          this.ui.writeResult.textContent =
            `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n` +
            `読み取り確認: NG\n${JSON.stringify(verifySummary, null, 2)}\n\n` +
            `考えられる原因:\n${reasons.join("\n")}`;
        }
        this.appendLog("write_verify", verifySummary);
      } catch (verifyError) {
        this.ui.writeResult.textContent =
          `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n` +
          `読み取り確認エラー: ${verifyError.message}`;
        this.appendLog("write_verify_error", {
          message: verifyError.message,
          name: verifyError.name || "Error",
          at: new Date().toISOString()
        });
      }
    } catch (error) {
      this.ui.writeResult.textContent = formatNfcError(error, "書き込み");
    } finally {
      this.isWriting = false;
      this.renderNfcState();
    }
  }
}
