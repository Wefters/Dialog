package dev.wefter.bridge

import android.content.Context
import android.text.InputType
import android.view.Gravity
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.FragmentActivity
import org.json.JSONObject

/** Native alerts, confirmations and prompts with `AlertDialog`, and toasts with `Toast`. */
class DialogPlugin(context: Context, dispatcher: BridgeDispatcher) :
        WefterPlugin(context, dispatcher) {

    private val activity: FragmentActivity
        get() = context as FragmentActivity

    /** Shows an alert with one button and resolves when it is dismissed. */
    @WefterMethod
    fun alert(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        val title = payload.optString("title", "").takeIf { it.isNotBlank() }
        val message = payload.optString("message", "")
        val buttonText = payload.optString("buttonText", "OK").ifBlank { "OK" }

        activity.runOnUiThread {
            val builder =
                    AlertDialog.Builder(activity)
                            .setMessage(message)
                            .setCancelable(false)
                            .setPositiveButton(buttonText) { dialog, _ ->
                                dialog.dismiss()
                                resolve(callback, JSONObject().put("value", true))
                            }

            title?.let { builder.setTitle(it) }
            builder.show()
        }
    }

    /** Shows OK and Cancel buttons and resolves with the user's choice. */
    @WefterMethod
    fun confirm(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        val title = payload.optString("title", "").takeIf { it.isNotBlank() }
        val message = payload.optString("message", "")
        val okText = payload.optString("okText", "OK").ifBlank { "OK" }
        val cancelText = payload.optString("cancelText", "Cancel").ifBlank { "Cancel" }

        activity.runOnUiThread {
            val builder =
                    AlertDialog.Builder(activity)
                            .setMessage(message)
                            .setCancelable(false)
                            .setPositiveButton(okText) { dialog, _ ->
                                dialog.dismiss()
                                resolve(callback, JSONObject().put("value", true))
                            }
                            .setNegativeButton(cancelText) { dialog, _ ->
                                dialog.dismiss()
                                resolve(callback, JSONObject().put("value", false))
                            }

            title?.let { builder.setTitle(it) }
            builder.show()
        }
    }

    /** Shows a text field and resolves with the text, or with `cancelled` set. */
    @WefterMethod
    fun prompt(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        val title = payload.optString("title", "").takeIf { it.isNotBlank() }
        val message = payload.optString("message", "")
        val okText = payload.optString("okText", "OK").ifBlank { "OK" }
        val cancelText = payload.optString("cancelText", "Cancel").ifBlank { "Cancel" }
        val placeholder = payload.optString("placeholder", "")
        val inputTypeStr = payload.optString("inputType", "text")
        val defaultValue = payload.optString("defaultValue", "")

        val androidInputType =
                when (inputTypeStr) {
                    "email" ->
                            InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
                    "password" ->
                            InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                    "number" -> InputType.TYPE_CLASS_NUMBER
                    "url" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
                    "tel" -> InputType.TYPE_CLASS_PHONE
                    else -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
                }

        activity.runOnUiThread {
            val editText =
                    EditText(activity).apply {
                        inputType = androidInputType
                        hint = placeholder
                        setText(defaultValue)
                        setSelection(defaultValue.length)
                        val pad = (16 * resources.displayMetrics.density).toInt()
                        setPadding(pad, pad / 2, pad, pad / 2)
                    }

            val builder =
                    AlertDialog.Builder(activity)
                            .setMessage(message)
                            .setView(editText)
                            .setCancelable(false)
                            .setPositiveButton(okText) { dialog, _ ->
                                val value = editText.text?.toString() ?: ""
                                dialog.dismiss()
                                resolve(
                                        callback,
                                        JSONObject().put("cancelled", false).put("value", value)
                                )
                            }
                            .setNegativeButton(cancelText) { dialog, _ ->
                                dialog.dismiss()
                                resolve(
                                        callback,
                                        JSONObject().put("cancelled", true).put("value", "")
                                )
                            }

            title?.let { builder.setTitle(it) }
            builder.show()
        }
    }

    /**
     * Shows a toast. Android only has short and long toasts: numbers up to 2000 (milliseconds) are short,
     * larger ones long.
     */
    @WefterMethod
    fun toast(payload: JSONObject, callback: (Result<Any>) -> Unit) {
        val text = payload.optString("text", "")
        if (text.isBlank()) {
            reject(callback, "INVALID_TEXT", "toast text must not be empty")
            return
        }

        val durationInt: Int =
                when {
                    payload.isNull("duration") -> Toast.LENGTH_SHORT
                    else -> {
                        val raw = payload.opt("duration")
                        when {
                            raw is Number ->
                                    if (raw.toLong() <= 2000L) Toast.LENGTH_SHORT
                                    else Toast.LENGTH_LONG
                            raw.toString() == "long" -> Toast.LENGTH_LONG
                            else -> Toast.LENGTH_SHORT
                        }
                    }
                }

        val gravity: Int =
                when (payload.optString("position", "bottom")) {
                    "top" -> Gravity.TOP or Gravity.CENTER_HORIZONTAL
                    "center" -> Gravity.CENTER
                    else -> Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                }

        activity.runOnUiThread {
            val toast = Toast.makeText(activity, text, durationInt)
            @Suppress("DEPRECATION") toast.setGravity(gravity, 0, 0)
            toast.show()
            resolve(callback, JSONObject().put("shown", true))
        }
    }
}
