export class LogStore {
  static instance;
  static STORAGE_KEY = "nfc-poc-events-v1";

  static getInstance() {
    if (!LogStore.instance) {
      LogStore.instance = new LogStore();
    }
    return LogStore.instance;
  }

  load() {
    const raw = localStorage.getItem(LogStore.STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  save(logs) {
    localStorage.setItem(LogStore.STORAGE_KEY, JSON.stringify(logs));
  }

  append(eventType, payload) {
    const logs = this.load();
    logs.push({
      eventType,
      payload,
      clientTime: new Date().toISOString()
    });
    this.save(logs);
    return logs;
  }

  clear() {
    this.save([]);
    return [];
  }

  exportAsJson() {
    const logs = this.load();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nfc-poc-logs-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
