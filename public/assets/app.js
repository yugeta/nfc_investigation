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

statusSecureContext.textContent = `Secure Context: ${isSecure ? "OK" : "NG"}`;
statusNdefApi.textContent = `Web NFC API: ${hasNdefReader ? "OK" : "NG"}`;

function setNfcControlsDisabled(disabled) {
  startScanButton.disabled = disabled;
  writeButton.disabled = disabled;
  writeText.disabled = disabled;
}

function showCompatibilityError(message) {
  compatibilityError.hidden = false;
  compatibilityError.textContent = message;
}

function checkCompatibility() {
  if (!isSecure && !hasNdefReader) {
    setNfcControlsDisabled(true);
    showCompatibilityError("この環境はWeb NFC未対応です。HTTPS配信のAndroid対応ブラウザでアクセスしてください。");
    return false;
  }

  if (!isSecure) {
    setNfcControlsDisabled(true);
    showCompatibilityError("Secure Contextではありません。HTTPSまたはlocalhostでアクセスしてください。");
    return false;
  }

  if (!hasNdefReader) {
    setNfcControlsDisabled(true);
    showCompatibilityError("このブラウザはWeb NFCに未対応です。Androidの対応ブラウザを利用してください。");
    return false;
  }

  compatibilityError.hidden = true;
  compatibilityError.textContent = "";
  setNfcControlsDisabled(false);
  return true;
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
  if (!("NDEFReader" in window)) {
    readResult.textContent = "このブラウザはWeb NFCに未対応です。";
    return;
  }

  try {
    const ndef = new NDEFReader();
    await ndef.scan();
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
    readResult.textContent = `読み取り開始エラー: ${error.message}`;
  }
});

writeButton.addEventListener("click", async () => {
  if (!("NDEFReader" in window)) {
    writeResult.textContent = "このブラウザはWeb NFCに未対応です。";
    return;
  }

  const text = writeText.value.trim();
  if (!text) {
    writeResult.textContent = "書き込むテキストを入力してください。";
    return;
  }

  try {
    const ndef = new NDEFReader();
    await ndef.write({
      records: [{ recordType: "text", data: text }]
    });

    const result = {
      writtenText: text,
      writtenAt: nowIso()
    };

    writeResult.textContent = `書き込み成功\n${JSON.stringify(result, null, 2)}`;
    appendLog("write", result);
  } catch (error) {
    writeResult.textContent = `書き込みエラー: ${error.message}`;
  }
});
