const statusSecureContext = document.getElementById("statusSecureContext");
const statusNdefApi = document.getElementById("statusNdefApi");
const startScanButton = document.getElementById("startScanButton");
const writeButton = document.getElementById("writeButton");
const writeText = document.getElementById("writeText");
const readResult = document.getElementById("readResult");
const writeResult = document.getElementById("writeResult");
const exportLogsButton = document.getElementById("exportLogsButton");
const clearLogsButton = document.getElementById("clearLogsButton");
const logSummary = document.getElementById("logSummary");
const compatibilityError = document.getElementById("compatibilityError");
const LOG_STORAGE_KEY = "nfc-poc-events-v1";
const hasNdefReader = "NDEFReader" in window;
const isSecure = window.isSecureContext;
let isCompatible = false;
let isScanning = false;
let isWriting = false;
let scanAbortController = null;

statusSecureContext.textContent = `Secure Context: ${isSecure ? "OK" : "NG"}`;
statusNdefApi.textContent = `Web NFC API: ${hasNdefReader ? "OK" : "NG"}`;

function setNfcControlsDisabled(disabled) {
  startScanButton.disabled = disabled;
  writeButton.disabled = disabled;
  writeText.disabled = disabled;
}

function renderNfcState() {
  if (!isCompatible) {
    setNfcControlsDisabled(true);
    return;
  }

  if (isWriting) {
    startScanButton.disabled = true;
    writeButton.disabled = true;
    writeText.disabled = true;
    startScanButton.textContent = "読み取り開始";
    return;
  }

  if (isScanning) {
    startScanButton.disabled = false;
    writeButton.disabled = true;
    writeText.disabled = true;
    startScanButton.textContent = "読み取り停止";
    return;
  }

  startScanButton.disabled = false;
  writeButton.disabled = false;
  writeText.disabled = false;
  startScanButton.textContent = "読み取り開始";
}

function showCompatibilityError(message) {
  compatibilityError.hidden = false;
  compatibilityError.textContent = message;
}

function checkCompatibility() {
  if (!isSecure && !hasNdefReader) {
    isCompatible = false;
    showCompatibilityError("この環境はWeb NFC未対応です。HTTPS配信のAndroid対応ブラウザでアクセスしてください。");
    renderNfcState();
    return false;
  }

  if (!isSecure) {
    isCompatible = false;
    showCompatibilityError("Secure Contextではありません。HTTPSまたはlocalhostでアクセスしてください。");
    renderNfcState();
    return false;
  }

  if (!hasNdefReader) {
    isCompatible = false;
    showCompatibilityError("このブラウザはWeb NFCに未対応です。Androidの対応ブラウザを利用してください。");
    renderNfcState();
    return false;
  }

  compatibilityError.hidden = true;
  compatibilityError.textContent = "";
  isCompatible = true;
  renderNfcState();
  return true;
}

function formatNfcError(error, actionLabel) {
  const name = error?.name || "Error";

  if (name === "NotAllowedError") {
    return `${actionLabel}エラー: NFCの許可が拒否されました。ブラウザ権限を確認してください。`;
  }

  if (name === "NotSupportedError") {
    return `${actionLabel}エラー: この端末またはタグはWeb NFC操作に未対応です。`;
  }

  if (name === "NotReadableError") {
    return `${actionLabel}エラー: タグ読み取りに失敗しました。タグ位置を変えて再試行してください。`;
  }

  if (name === "AbortError") {
    return `${actionLabel}を停止しました。`;
  }

  return `${actionLabel}エラー: ${error?.message || "不明なエラー"}`;
}

function stopScan() {
  if (scanAbortController) {
    scanAbortController.abort();
  }
  scanAbortController = null;
  isScanning = false;
  renderNfcState();
}

function nowIso() {
  return new Date().toISOString();
}

function loadLogs() {
  const raw = localStorage.getItem(LOG_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  logSummary.textContent = `ログ件数: ${logs.length}`;
}

function appendLog(eventType, payload) {
  const logs = loadLogs();
  logs.push({
    eventType,
    payload,
    clientTime: nowIso()
  });
  saveLogs(logs);
}

function parseRecord(record) {
  if (record.recordType === "text") {
    return { type: "text", value: record.data };
  }

  if (record.recordType === "url") {
    return { type: "url", value: record.data };
  }

  if (record.recordType === "mime") {
    return { type: `mime:${record.mediaType}`, value: "(binary or custom payload)" };
  }

  return { type: record.recordType, value: "(unsupported preview)" };
}

function createTimeoutError(message) {
  const error = new Error(message);
  error.name = "TimeoutError";
  return error;
}

async function readBackOnce(timeoutMs = 4000) {
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

      const serialNumber = event.serialNumber || "(not available)";
      const records = [];
      for (const record of event.message.records) {
        records.push(parseRecord(record));
      }

      resolve({
        serialNumber,
        records,
        readAt: nowIso()
      });
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

function exportLogs() {
  const logs = loadLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nfc-poc-logs-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function clearLogs() {
  saveLogs([]);
}

exportLogsButton.addEventListener("click", exportLogs);
clearLogsButton.addEventListener("click", clearLogs);
saveLogs(loadLogs());
checkCompatibility();

startScanButton.addEventListener("click", async () => {
  if (!isCompatible) {
    readResult.textContent = "このブラウザはWeb NFCに未対応です。";
    return;
  }

  if (isScanning) {
    stopScan();
    readResult.textContent = "読み取りを停止しました。";
    return;
  }

  try {
    const ndef = new NDEFReader();
    scanAbortController = new AbortController();
    await ndef.scan({ signal: scanAbortController.signal });
    isScanning = true;
    renderNfcState();
    readResult.textContent = "スキャン開始。タグをかざしてください。";

    ndef.onreadingerror = () => {
      readResult.textContent = "タグは検出されましたが、読み取りに失敗しました。";
    };

    ndef.onreading = (event) => {
      const serialNumber = event.serialNumber || "(not available)";
      const records = [];

      for (const record of event.message.records) {
        records.push(parseRecord(record));
      }

      const result = {
        serialNumber,
        records,
        readAt: nowIso()
      };

      readResult.textContent = JSON.stringify(result, null, 2);
      appendLog("read", result);
    };
  } catch (error) {
    readResult.textContent = formatNfcError(error, "読み取り");
    stopScan();
  }
});

writeButton.addEventListener("click", async () => {
  if (!isCompatible) {
    writeResult.textContent = "このブラウザはWeb NFCに未対応です。";
    return;
  }

  if (isWriting) {
    return;
  }

  if (isScanning) {
    stopScan();
    readResult.textContent = "書き込みのため、読み取りを停止しました。";
  }

  const text = writeText.value.trim();
  if (!text) {
    writeResult.textContent = "書き込むテキストを入力してください。";
    return;
  }

  try {
    isWriting = true;
    renderNfcState();
    writeResult.textContent = "書き込み待機中です。タグを端末にかざしてください。";

    const ndef = new NDEFReader();
    await ndef.write({
      records: [{ recordType: "text", data: text }]
    });

    const result = {
      writtenText: text,
      writtenAt: nowIso()
    };

    writeResult.textContent = `書き込み成功\n${JSON.stringify(result, null, 2)}\n\n読み取り確認中...`;
    appendLog("write", result);

    try {
      const verifyResult = await readBackOnce();
      const textRecords = verifyResult.records
        .filter((record) => record.type === "text")
        .map((record) => record.value);
      const isVerified = textRecords.includes(text);

      const verifySummary = {
        verified: isVerified,
        expectedText: text,
        detectedTextRecords: textRecords,
        verifyReadAt: verifyResult.readAt,
        serialNumber: verifyResult.serialNumber
      };

      writeResult.textContent =
        `書き込み成功\n${JSON.stringify(result, null, 2)}\n\n` +
        `読み取り確認: ${isVerified ? "OK" : "NG"}\n${JSON.stringify(verifySummary, null, 2)}`;
      appendLog("write_verify", verifySummary);
    } catch (verifyError) {
      writeResult.textContent =
        `書き込み成功\n${JSON.stringify(result, null, 2)}\n\n` +
        `読み取り確認エラー: ${verifyError.message}`;
      appendLog("write_verify_error", {
        message: verifyError.message,
        name: verifyError.name || "Error",
        at: nowIso()
      });
    }
  } catch (error) {
    writeResult.textContent = formatNfcError(error, "書き込み");
  } finally {
    isWriting = false;
    renderNfcState();
  }
});
