import { showWriteVerifyError, showWriteVerifyNg, showWriteVerifyOk } from "./write_result_view.js";
import { buildWriteVerification } from "./write_verification.js";
import { buildWriteVerifyErrorLogPayload } from "./write_verify_error_log.js";

export async function runWriteVerifyFlow({
  nfcController,
  state,
  payload,
  preWriteSnapshot,
  writeResult,
  ui,
  syncDraftFromReadResult,
  appendLog
}) {
  try {
    const verifyResult = await nfcController.readBackOnce();
    state.updateLastReadSnapshot("write_verify", verifyResult);
    syncDraftFromReadResult(verifyResult);

    const verification = buildWriteVerification({
      verifyResult,
      expectedPayload: payload,
      preWriteSnapshot
    });
    const { verifySummary, isVerified, reasons } = verification;

    if (isVerified) {
      showWriteVerifyOk(ui, writeResult, verifySummary);
    } else {
      showWriteVerifyNg(ui, writeResult, verifySummary, reasons);
    }
    appendLog("write_verify", verifySummary);
  } catch (verifyError) {
    showWriteVerifyError(ui, writeResult, verifyError.message);
    appendLog("write_verify_error", buildWriteVerifyErrorLogPayload(verifyError));
  }
}
