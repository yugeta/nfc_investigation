import { persistWriteDraftFromInputs } from "./write_draft_store.js";
import { buildWriteRecords, readWritePayloadFromUi, validateWritePayload } from "./write_payload.js";

export function buildWriteRequest(ui) {
  const payload = readWritePayloadFromUi(ui);
  persistWriteDraftFromInputs(ui);

  const validation = validateWritePayload(payload);
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
      payload: null,
      records: null
    };
  }

  return {
    ok: true,
    message: "",
    payload,
    records: buildWriteRecords(payload)
  };
}
