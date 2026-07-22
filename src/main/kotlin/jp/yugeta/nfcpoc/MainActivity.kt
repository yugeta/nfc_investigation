package jp.yugeta.nfcpoc

import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView

class MainActivity : Activity(), NfcAdapter.ReaderCallback {

    private lateinit var modeText: TextView
    private lateinit var resultText: TextView
    private lateinit var writePayloadInput: EditText
    private lateinit var toggleModeButton: Button

    private var mode: Mode = Mode.READ
    private val manager = NfcSessionManager()
    private var nfcAdapter: NfcAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        modeText = findViewById(R.id.modeText)
        resultText = findViewById(R.id.resultText)
        writePayloadInput = findViewById(R.id.writePayloadInput)
        toggleModeButton = findViewById(R.id.toggleModeButton)

        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        if (nfcAdapter == null) {
            resultText.text = "This device does not support NFC."
            toggleModeButton.isEnabled = false
            writePayloadInput.isEnabled = false
            return
        }

        toggleModeButton.setOnClickListener {
            mode = if (mode == Mode.READ) Mode.WRITE else Mode.READ
            renderMode()
        }
        renderMode()
    }

    override fun onResume() {
        super.onResume()
        val flags = NfcAdapter.FLAG_READER_NFC_A or
            NfcAdapter.FLAG_READER_NFC_B or
            NfcAdapter.FLAG_READER_NFC_F or
            NfcAdapter.FLAG_READER_NFC_V or
            NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK
        nfcAdapter?.enableReaderMode(this, this, flags, null)
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter?.disableReaderMode(this)
    }

    override fun onTagDiscovered(tag: Tag) {
        val output = try {
            when (mode) {
                Mode.READ -> {
                    val result = manager.readTag(tag)
                    buildString {
                        appendLine("Read succeeded")
                        appendLine("Tag ID: ${result.idHex}")
                        appendLine("Tech: ${result.techList.joinToString()}")
                        if (result.textRecords.isEmpty()) {
                            appendLine("NDEF Text: (none)")
                        } else {
                            appendLine("NDEF Text:")
                            result.textRecords.forEachIndexed { index, text ->
                                appendLine("  [${index + 1}] $text")
                            }
                        }
                    }
                }
                Mode.WRITE -> {
                    val payload = writePayloadInput.text?.toString().orEmpty().ifBlank { "default-text" }
                    manager.writeTextToTag(tag, payload)
                    "Write succeeded\nWritten text: $payload"
                }
            }
        } catch (e: Exception) {
            "Operation failed: ${e.message}"
        }

        runOnUiThread {
            resultText.text = output
        }
    }

    private fun renderMode() {
        if (mode == Mode.READ) {
            modeText.text = "Mode: READ"
            toggleModeButton.text = "Switch to WRITE mode"
        } else {
            modeText.text = "Mode: WRITE"
            toggleModeButton.text = "Switch to READ mode"
        }
    }

    private enum class Mode {
        READ,
        WRITE
    }
}
