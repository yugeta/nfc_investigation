export function nowIso() {
  return new Date().toISOString();
}

export function parseRecord(record) {
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

export function parseReadingEvent(event) {
  const serialNumber = event.serialNumber || "(not available)";
  const records = [];

  for (const record of event.message.records) {
    records.push(parseRecord(record));
  }

  return {
    serialNumber,
    records,
    readAt: nowIso()
  };
}

export function createTimeoutError(message) {
  const error = new Error(message);
  error.name = "TimeoutError";
  return error;
}

export function formatNfcError(error, actionLabel) {
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

  if (name === "TimeoutError") {
    return `${actionLabel}エラー: ${error.message}`;
  }

  return `${actionLabel}エラー: ${error?.message || "不明なエラー"}`;
}
