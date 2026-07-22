export function showWriteWaiting(ui) {
  ui.writeResult.textContent = "書き込み待機中です。タグを端末にかざしてください。";
}

export function showWriteSuccessPendingVerify(ui, writeResult) {
  ui.writeResult.textContent =
    `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n読み取り確認中...`;
}

export function showWriteVerifyOk(ui, writeResult, verifySummary) {
  ui.writeResult.textContent =
    `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n` +
    `読み取り確認: OK\n${JSON.stringify(verifySummary, null, 2)}`;
}

export function showWriteVerifyNg(ui, writeResult, verifySummary, reasons) {
  ui.writeResult.textContent =
    `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n` +
    `読み取り確認: NG\n${JSON.stringify(verifySummary, null, 2)}\n\n` +
    `考えられる原因:\n${reasons.join("\n")}`;
}

export function showWriteVerifyError(ui, writeResult, verifyErrorMessage) {
  ui.writeResult.textContent =
    `書き込み成功\n${JSON.stringify(writeResult, null, 2)}\n\n` +
    `読み取り確認エラー: ${verifyErrorMessage}`;
}

export function showWriteValidationMessage(ui, message) {
  ui.writeResult.textContent = message;
}

export function showWriteActionError(ui, errorMessage) {
  ui.writeResult.textContent = errorMessage;
}
