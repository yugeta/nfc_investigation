import { CompatibilityChecker } from "./compatibility_checker.js";
import { LogStore } from "./log_store.js";
import { NfcController } from "./nfc_controller.js";
import { formatNfcError } from "./nfc_utils.js";
import { UiElements } from "./ui_elements.js";

function normalizeText(value) {
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
  }

  init() {
    this.bindEvents();
    this.renderLogSummary(this.logStore.load());
    this.applyCompatibility();
    this.renderNfcState();
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
      this.ui.writeText.disabled = true;
      return;
    }

    if (this.isWriting) {
      this.ui.startScanButton.disabled = true;
      this.ui.writeButton.disabled = true;
      this.ui.writeText.disabled = true;
      this.ui.startScanButton.textContent = "読み取り開始";
      return;
    }

    if (this.isScanning) {
      this.ui.startScanButton.disabled = false;
      this.ui.writeButton.disabled = true;
      this.ui.writeText.disabled = true;
      this.ui.startScanButton.textContent = "読み取り停止";
      return;
    }

    this.ui.startScanButton.disabled = false;
    this.ui.writeButton.disabled = false;
    this.ui.writeText.disabled = false;
    this.ui.startScanButton.textContent = "読み取り開始";
  }

  renderLogSummary(logs) {
    this.ui.logSummary.textContent = `ログ件数: ${logs.length}`;
  }

  appendLog(eventType, payload) {
    const logs = this.logStore.append(eventType, payload);
    this.renderLogSummary(logs);
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

    const text = this.ui.writeText.value.trim();
    if (!text) {
      this.ui.writeResult.textContent = "書き込むテキストを入力してください。";
      return;
    }

    try {
      this.isWriting = true;
      this.renderNfcState();
      this.ui.writeResult.textContent = "書き込み待機中です。タグを端末にかざしてください。";

      const writeResult = await this.nfcController.writeText(text);
      this.ui.writeResult.textContent =
        `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n読み取り確認中...`;
      this.appendLog("write", writeResult);

      try {
        const verifyResult = await this.nfcController.readBackOnce();
        const textRecords = verifyResult.records
          .filter((record) => record.type === "text")
          .map((record) => normalizeText(record.value));
        const isVerified = textRecords.includes(normalizeText(text));

        const verifySummary = {
          verified: isVerified,
          expectedText: text,
          detectedTextRecords: textRecords,
          verifyReadAt: verifyResult.readAt,
          serialNumber: verifyResult.serialNumber
        };

        this.ui.writeResult.textContent =
          `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n` +
          `読み取り確認: ${isVerified ? "OK" : "NG"}\n${JSON.stringify(verifySummary, null, 2)}`;
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
