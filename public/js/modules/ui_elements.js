export class UiElements {
  static instance;

  static getInstance() {
    if (!UiElements.instance) {
      UiElements.instance = new UiElements();
    }
    return UiElements.instance;
  }

  constructor() {
    this.statusSecureContext = document.getElementById("statusSecureContext");
    this.statusNdefApi = document.getElementById("statusNdefApi");
    this.startScanButton = document.getElementById("startScanButton");
    this.writeButton = document.getElementById("writeButton");
    this.writeText = document.getElementById("writeText");
    this.readResult = document.getElementById("readResult");
    this.writeResult = document.getElementById("writeResult");
    this.exportLogsButton = document.getElementById("exportLogsButton");
    this.clearLogsButton = document.getElementById("clearLogsButton");
    this.logSummary = document.getElementById("logSummary");
    this.compatibilityError = document.getElementById("compatibilityError");
  }
}
