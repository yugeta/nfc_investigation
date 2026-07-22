import { extractComparableValues } from "./record_compare.js";

export function buildWriteVerification({ verifyResult, expectedPayload, preWriteSnapshot }) {
  const expectedValues = [expectedPayload.text, expectedPayload.uri].filter((value) => value && value.length > 0);
  const comparableValues = extractComparableValues(verifyResult.records);
  const isVerified = expectedValues.every((value) => comparableValues.includes(value));
  const serialChanged =
    !!preWriteSnapshot?.serialNumber &&
    preWriteSnapshot.serialNumber !== verifyResult.serialNumber;

  const verifySummary = {
    verified: isVerified,
    expectedValues,
    detectedComparableValues: comparableValues,
    detectedRecords: verifyResult.records,
    verifyReadAt: verifyResult.readAt,
    serialNumber: verifyResult.serialNumber,
    previousSerialNumber: preWriteSnapshot?.serialNumber || null,
    serialChanged
  };

  const reasons = [];
  if (serialChanged) {
    reasons.push("- 読み取り確認時のタグが別タグの可能性があります（serialNumberが変化）。");
  }
  if (comparableValues.length === 0) {
    reasons.push("- 読み取れたレコードに比較可能な文字列がありません。タグ形式が想定外の可能性があります。");
  }
  reasons.push("- タグが書き込み不可（ロック済み/権限制約）の可能性があります。");
  reasons.push("- 書き込み後に同じタグを十分近づけていない可能性があります。");

  return {
    verifySummary,
    isVerified,
    reasons
  };
}
