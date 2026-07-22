export function nowIso() {
  return new Date().toISOString();
}

function toUint8Array(data) {
  if (data instanceof DataView) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  return null;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBytes(bytes, encoding = "utf-8") {
  return new TextDecoder(encoding).decode(bytes);
}

function decodeRecordValue(record) {
  const data = record.data;

  if (typeof data === "string") {
    return data;
  }

  const bytes = toUint8Array(data);
  if (bytes) {
    return decodeBytes(bytes, record.encoding || "utf-8");
  }

  return "";
}

export function parseRecord(record) {
  const bytes = toUint8Array(record.data);
  const byteLength = bytes ? bytes.byteLength : 0;
  const hexPreview = bytes ? bytesToHex(bytes.slice(0, 48)) : "";

  const base = {
    type: record.recordType,
    id: record.id || "",
    mediaType: record.mediaType || "",
    encoding: record.encoding || "",
    lang: record.lang || "",
    byteLength,
    hexPreview
  };

  if (record.recordType === "text") {
    const value = decodeRecordValue(record);
    return {
      ...base,
      type: "text",
      value
    };
  }

  if (record.recordType === "url") {
    const value = decodeRecordValue(record);
    return {
      ...base,
      type: "url",
      value
    };
  }

  if (record.recordType === "mime") {
    const isTextLike = typeof record.mediaType === "string" && record.mediaType.startsWith("text/");
    const value = isTextLike ? decodeRecordValue(record) : "(binary or custom payload)";
    return {
      ...base,
      type: `mime:${record.mediaType}`,
      value,
      base64Preview: bytes ? bytesToBase64(bytes.slice(0, 48)) : ""
    };
  }

  let fallbackText = "";
  if (bytes) {
    try {
      fallbackText = decodeBytes(bytes, "utf-8");
    } catch (_) {
      fallbackText = "";
    }
  }

  return {
    ...base,
    value: fallbackText || "(unsupported preview)",
    base64Preview: bytes ? bytesToBase64(bytes.slice(0, 48)) : ""
  };
}

export function parseReadingEvent(event) {
  const serialNumber = event.serialNumber || "(not available)";
  const records = [];

  for (const record of event.message.records) {
    records.push(parseRecord(record));
  }

  return {
    serialNumber,
    serialAvailable: !!event.serialNumber,
    recordCount: records.length,
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
