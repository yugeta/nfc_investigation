import { normalizeText, normalizeUri } from "./value_normalizers.js";

export function extractWriteDraftFromRecords(records) {
  const firstText = records.find((record) => record.type === "text" && normalizeText(record.value).length > 0);
  const firstUri = records.find((record) => record.type === "url" && normalizeUri(record.value).length > 0);

  return {
    text: firstText ? firstText.value : "",
    uri: firstUri ? firstUri.value : ""
  };
}

export function hasWriteDraftValue(draft) {
  return normalizeText(draft?.text || "").length > 0 || normalizeUri(draft?.uri || "").length > 0;
}
