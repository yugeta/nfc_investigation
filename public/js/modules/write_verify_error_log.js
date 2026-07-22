export function buildWriteVerifyErrorLogPayload(verifyError) {
  return {
    message: verifyError.message,
    name: verifyError.name || "Error",
    at: new Date().toISOString()
  };
}
