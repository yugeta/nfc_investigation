import { createTimeoutError, nowIso, parseReadingEvent } from "./nfc_utils.js";

export class NfcController {
  static instance;

  static getInstance() {
    if (!NfcController.instance) {
      NfcController.instance = new NfcController();
    }
    return NfcController.instance;
  }

  constructor() {
    this.scanAbortController = null;
  }

  async startScan(onReading, onReadingError) {
    const reader = new NDEFReader();
    this.scanAbortController = new AbortController();
    await reader.scan({ signal: this.scanAbortController.signal });

    reader.onreadingerror = () => {
      if (onReadingError) {
        onReadingError(new Error("タグは検出されましたが、読み取りに失敗しました。"));
      }
    };

    reader.onreading = (event) => {
      onReading(parseReadingEvent(event));
    };
  }

  stopScan() {
    if (this.scanAbortController) {
      this.scanAbortController.abort();
    }
    this.scanAbortController = null;
  }

  async writeRecords(records) {
    const ndef = new NDEFReader();
    await ndef.write({ records });
  }

  async writeText(text) {
    await this.writeRecords([{ recordType: "text", data: text }]);

    return {
      kind: "text",
      writtenText: text,
      writtenAt: nowIso()
    };
  }

  async writeUri(uri) {
    await this.writeRecords([{ recordType: "url", data: uri }]);

    return {
      kind: "uri",
      writtenUri: uri,
      writtenAt: nowIso()
    };
  }

  async readBackOnce(timeoutMs = 4000) {
    const reader = new NDEFReader();
    const controller = new AbortController();

    return new Promise((resolve, reject) => {
      let completed = false;

      const timer = setTimeout(() => {
        if (completed) {
          return;
        }
        completed = true;
        controller.abort();
        reject(createTimeoutError("読み取り確認がタイムアウトしました。タグを再度かざして再試行してください。"));
      }, timeoutMs);

      reader.onreadingerror = () => {
        if (completed) {
          return;
        }
        completed = true;
        clearTimeout(timer);
        controller.abort();
        reject(new Error("読み取り確認でタグは検出されましたが、データ取得に失敗しました。"));
      };

      reader.onreading = (event) => {
        if (completed) {
          return;
        }
        completed = true;
        clearTimeout(timer);
        controller.abort();
        resolve(parseReadingEvent(event));
      };

      reader.scan({ signal: controller.signal }).catch((error) => {
        if (completed) {
          return;
        }
        completed = true;
        clearTimeout(timer);
        reject(error);
      });
    });
  }
}
