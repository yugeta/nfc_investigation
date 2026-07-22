export function applyCompatibilityToUi({ ui, compatibilityChecker }) {
  const result = compatibilityChecker.evaluate();

  ui.statusSecureContext.textContent = `Secure Context: ${result.isSecure ? "OK" : "NG"}`;
  ui.statusNdefApi.textContent = `Web NFC API: ${result.hasNdefReader ? "OK" : "NG"}`;

  if (!result.ok) {
    ui.compatibilityError.hidden = false;
    ui.compatibilityError.textContent = `${result.message} (secure=${result.isSecure}, ndefApi=${result.hasNdefReader})`;
  } else {
    ui.compatibilityError.hidden = true;
    ui.compatibilityError.textContent = "";
  }

  return {
    isCompatible: result.ok,
    compatibilityMessage: result.message || ""
  };
}

export function applyIncompatibleMessage(targetElement, compatibilityMessage) {
  if (!targetElement) {
    return;
  }
  targetElement.textContent = compatibilityMessage || "この環境ではWeb NFCが利用できません。";
}
