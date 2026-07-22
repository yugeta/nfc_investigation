import { normalizeText, normalizeUri } from "./value_normalizers.js";

export function readWritePayloadFromUi(ui) {
  return {
    text: normalizeText(ui.writeText.value),
    uri: normalizeUri(ui.writeUri.value)
  };
}

export function validateWritePayload(payload) {
  const { text, uri } = payload;

  if (!text && !uri) {
    return {
      ok: false,
      message: "テキストまたはURIのどちらかを入力してください。"
    };
  }

  if (uri) {
    try {
      new URL(uri);
    } catch (_) {
      return {
        ok: false,
        message: "URI形式が不正です。https://から始まる形式を入力してください。"
      };
    }
  }

  return { ok: true, message: "" };
}

export function buildWriteRecords(payload) {
  const { text, uri } = payload;
  const records = [];

  // URI first for better Android auto-launch behavior.
  if (uri) {
    records.push({ recordType: "url", data: uri });
  }
  if (text) {
    records.push({ recordType: "text", data: text });
  }

  return records;
}

export function buildWriteResult(payload, records) {
  return {
    recordCount: records.length,
    writtenText: payload.text || null,
    writtenUri: payload.uri || null,
    writtenAt: new Date().toISOString()
  };
}
