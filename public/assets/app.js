const statusSecureContext = document.getElementById("statusSecureContext");
const statusNdefApi = document.getElementById("statusNdefApi");
const startScanButton = document.getElementById("startScanButton");
const writeButton = document.getElementById("writeButton");
const writeText = document.getElementById("writeText");
const readResult = document.getElementById("readResult");
const writeResult = document.getElementById("writeResult");

statusSecureContext.textContent = `Secure Context: ${window.isSecureContext ? "OK" : "NG"}`;
statusNdefApi.textContent = `Web NFC API: ${"NDEFReader" in window ? "OK" : "NG"}`;

function nowIso() {
  return new Date().toISOString();
}

function toHex(arrayBuffer) {
  return Array.from(new Uint8Array(arrayBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function parseRecord(record) {
  if (record.recordType === "text") {
    return { type: "text", value: record.data };
  }

  if (record.recordType === "url") {
    return { type: "url", value: record.data };
  }

  if (record.recordType === "mime") {
    return { type: `mime:${record.mediaType}`, value: "(binary or custom payload)" };
  }

  return { type: record.recordType, value: "(unsupported preview)" };
}

async function saveLog(eventType, payload) {
  try {
    await fetch("./api/log_scan.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventType,
        payload,
        clientTime: nowIso()
      })
    });
  } catch (_) {
    // Logging failure should not block the PoC flow.
  }
}

startScanButton.addEventListener("click", async () => {
  if (!("NDEFReader" in window)) {
    readResult.textContent = "このブラウザはWeb NFCに未対応です。";
    return;
  }

  try {
    const ndef = new NDEFReader();
    await ndef.scan();
    readResult.textContent = "スキャン開始。タグをかざしてください。";

    ndef.onreadingerror = () => {
      readResult.textContent = "タグは検出されましたが、読み取りに失敗しました。";
    };

    ndef.onreading = async (event) => {
      const serialNumber = event.serialNumber || "(not available)";
      const records = [];

      for (const record of event.message.records) {
        records.push(parseRecord(record));
      }

      const result = {
        serialNumber,
        records,
        readAt: nowIso()
      };

      readResult.textContent = JSON.stringify(result, null, 2);
      await saveLog("read", result);
    };
  } catch (error) {
    readResult.textContent = `読み取り開始エラー: ${error.message}`;
  }
});

writeButton.addEventListener("click", async () => {
  if (!("NDEFReader" in window)) {
    writeResult.textContent = "このブラウザはWeb NFCに未対応です。";
    return;
  }

  const text = writeText.value.trim();
  if (!text) {
    writeResult.textContent = "書き込むテキストを入力してください。";
    return;
  }

  try {
    const ndef = new NDEFReader();
    await ndef.write({
      records: [{ recordType: "text", data: text }]
    });

    const result = {
      writtenText: text,
      writtenAt: nowIso()
    };

    writeResult.textContent = `書き込み成功\n${JSON.stringify(result, null, 2)}`;
    await saveLog("write", result);
  } catch (error) {
    writeResult.textContent = `書き込みエラー: ${error.message}`;
  }
});
