import { extractWriteDraftFromRecords, hasWriteDraftValue } from "./write_draft_mapper.js";
import { applyWriteDraftToInputs, saveWriteDraft } from "./write_draft_store.js";

export function syncWriteDraftFromReadResult(ui, readResult) {
  if (!readResult || !Array.isArray(readResult.records)) {
    return false;
  }

  const draft = extractWriteDraftFromRecords(readResult.records);
  if (!hasWriteDraftValue(draft)) {
    return false;
  }

  applyWriteDraftToInputs(ui, draft);
  saveWriteDraft(draft);
  return true;
}
