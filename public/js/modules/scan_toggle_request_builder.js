export function buildScanToggleRequest({ ui, state, ensureCompatibilityFor }) {
  if (!ensureCompatibilityFor(ui.readResult)) {
    return {
      ok: false,
      action: "blocked"
    };
  }

  if (state.isScanning) {
    return {
      ok: true,
      action: "stop"
    };
  }

  return {
    ok: true,
    action: "start"
  };
}
