import { normalizeText, normalizeUri } from "./value_normalizers.js";

const WRITE_DRAFT_STORAGE_KEY = "nfc-poc-write-draft-v1";

export function loadWriteDraft() {
  const raw = localStorage.getItem(WRITE_DRAFT_STORAGE_KEY);
  if (!raw) {
    return { text: "", uri: "" };
  }

  try {
    const draft = JSON.parse(raw);
    return {
      text: normalizeText(draft.text || ""),
      uri: normalizeUri(draft.uri || "")
    };
  } catch (_) {
    return { text: "", uri: "" };
  }
}

export function saveWriteDraft(draft) {
  const normalized = {
    text: normalizeText(draft?.text || ""),
    uri: normalizeUri(draft?.uri || ""),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(WRITE_DRAFT_STORAGE_KEY, JSON.stringify(normalized));
}

export function readWriteDraftFromInputs(ui) {
  return {
    text: normalizeText(ui.writeText.value),
    uri: normalizeUri(ui.writeUri.value)
  };
}

export function applyWriteDraftToInputs(ui, draft) {
  ui.writeText.value = normalizeText(draft?.text || "");
  ui.writeUri.value = normalizeUri(draft?.uri || "");
}

export function persistWriteDraftFromInputs(ui) {
  saveWriteDraft(readWriteDraftFromInputs(ui));
}
