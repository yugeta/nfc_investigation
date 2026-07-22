export class NfcRuntimeState {
  constructor() {
    this.isCompatible = false;
    this.compatibilityMessage = "";
    this.isScanning = false;
    this.isWriting = false;
    this.lastReadSnapshot = null;
  }

  setCompatibility(isCompatible, compatibilityMessage) {
    this.isCompatible = isCompatible;
    this.compatibilityMessage = compatibilityMessage || "";
  }

  setScanning(isScanning) {
    this.isScanning = !!isScanning;
  }

  setWriting(isWriting) {
    this.isWriting = !!isWriting;
  }

  updateLastReadSnapshot(source, readResult) {
    this.lastReadSnapshot = {
      source,
      serialNumber: readResult.serialNumber,
      records: readResult.records,
      at: readResult.readAt || new Date().toISOString()
    };
  }
}
