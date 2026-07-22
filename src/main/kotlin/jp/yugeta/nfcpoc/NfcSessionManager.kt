package jp.yugeta.nfcpoc

import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import java.nio.charset.Charset

data class TagReadResult(
    val techList: List<String>,
    val idHex: String,
    val textRecords: List<String>
)

class NfcSessionManager {

    fun readTag(tag: Tag): TagReadResult {
        val techList = tag.techList.toList()
        val idHex = tag.id.joinToString(separator = "") { "%02X".format(it) }

        val ndef = Ndef.get(tag)
        if (ndef == null) {
            return TagReadResult(techList, idHex, emptyList())
        }

        return try {
            ndef.connect()
            val message = ndef.cachedNdefMessage ?: ndef.ndefMessage
            val texts = message?.records
                ?.mapNotNull { decodeTextRecord(it) }
                ?: emptyList()
            TagReadResult(techList, idHex, texts)
        } finally {
            if (ndef.isConnected) {
                ndef.close()
            }
        }
    }

    fun writeTextToTag(tag: Tag, text: String) {
        val message = NdefMessage(arrayOf(createTextRecord(text)))

        val ndef = Ndef.get(tag)
        if (ndef != null) {
            ndef.connect()
            try {
                require(ndef.isWritable) { "Tag is read-only." }
                val payloadSize = message.toByteArray().size
                require(ndef.maxSize >= payloadSize) {
                    "Tag capacity is not enough. required=$payloadSize, max=${ndef.maxSize}"
                }
                ndef.writeNdefMessage(message)
            } finally {
                if (ndef.isConnected) {
                    ndef.close()
                }
            }
            return
        }

        val formatable = NdefFormatable.get(tag)
            ?: error("Tag does not support NDEF write/format.")

        formatable.connect()
        try {
            formatable.format(message)
        } finally {
            if (formatable.isConnected) {
                formatable.close()
            }
        }
    }

    private fun createTextRecord(text: String): NdefRecord {
        val language = "en"
        val languageBytes = language.toByteArray(Charset.forName("US-ASCII"))
        val textBytes = text.toByteArray(Charset.forName("UTF-8"))
        val payload = ByteArray(1 + languageBytes.size + textBytes.size)

        payload[0] = languageBytes.size.toByte()
        System.arraycopy(languageBytes, 0, payload, 1, languageBytes.size)
        System.arraycopy(textBytes, 0, payload, 1 + languageBytes.size, textBytes.size)

        return NdefRecord(
            NdefRecord.TNF_WELL_KNOWN,
            NdefRecord.RTD_TEXT,
            ByteArray(0),
            payload
        )
    }

    private fun decodeTextRecord(record: NdefRecord): String? {
        val isTextRecord = record.tnf == NdefRecord.TNF_WELL_KNOWN &&
            record.type.contentEquals(NdefRecord.RTD_TEXT)
        if (!isTextRecord) {
            return null
        }

        val payload = record.payload
        if (payload.isEmpty()) {
            return ""
        }

        val status = payload[0].toInt()
        val langLength = status and 0x3F
        val isUtf16 = (status and 0x80) != 0
        val encoding = if (isUtf16) "UTF-16" else "UTF-8"

        return payload.copyOfRange(1 + langLength, payload.size).toString(Charset.forName(encoding))
    }
}
