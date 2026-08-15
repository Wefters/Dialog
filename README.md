# @wefterjs/dialog

Official Wefter plugin for native alert, confirm, prompt, and toast dialogs on Android & iOS.  
No permissions. No hardware. Pure UI.

---

## Features

- 🔔 **Alert** — Native blocking alert with a single dismiss button.
- ✅ **Confirm** — OK / Cancel dialog that resolves with `{ value: boolean }`.
- ✏️ **Prompt** — Input dialog that resolves with the user's text (or `cancelled: true`).
- 🍞 **Toast** — Lightweight non-blocking notification that auto-dismisses.

---

## Platform implementation

| Method    | Android                              | iOS                                            |
|-----------|--------------------------------------|------------------------------------------------|
| `alert`   | `AlertDialog.Builder`                | `UIAlertController` (`.alert`)                 |
| `confirm` | `AlertDialog.Builder`                | `UIAlertController` (`.alert`)                 |
| `prompt`  | `AlertDialog.Builder` + `EditText`   | `UIAlertController` + `addTextField`           |
| `toast`   | `Toast.makeText()`                   | Custom `UILabel` overlay with fade animations  |

No Gradle or CocoaPods dependencies required.

---

## Installation

```bash
wefter add @wefterjs/dialog
wefter sync
```

---

## Permissions

None. Dialog and toast APIs are pure UI — they require no runtime permissions on either platform.

---

## JavaScript API Reference

```ts
import { Dialog } from "@wefterjs/dialog";
```

### `Dialog.alert(options)`

Shows a native alert with a single dismiss button. Resolves when the user taps it.

```ts
interface AlertOptions {
  title?: string;       // Bold title above the message
  message: string;      // Body text
  buttonText?: string;  // Dismiss button label (default: "OK")
}

await Dialog.alert({ title: "Done", message: "Your file was saved." });
// → { value: true }
```

---

### `Dialog.confirm(options)`

Shows a native two-button confirm dialog. Resolves with `{ value: true }` (OK) or `{ value: false }` (Cancel).

```ts
interface ConfirmOptions {
  title?: string;
  message: string;
  okText?: string;      // Default: "OK"
  cancelText?: string;  // Default: "Cancel"
}

const { value } = await Dialog.confirm({ message: "Delete this item?" });
if (value) {
  // user tapped OK
}
```

---

### `Dialog.prompt(options)`

Shows a native text-input dialog. Resolves with the user's typed value or `cancelled: true` if dismissed.

```ts
type InputType = "text" | "email" | "password" | "number" | "url" | "tel";

interface PromptOptions {
  title?: string;
  message: string;
  okText?: string;       // Default: "OK"
  cancelText?: string;   // Default: "Cancel"
  placeholder?: string;  // Ghost text in the field
  inputType?: InputType; // Keyboard / input mode (default: "text")
  defaultValue?: string; // Pre-filled text
}

interface PromptResult {
  cancelled: boolean;
  value: string;         // "" when cancelled
}

const { cancelled, value } = await Dialog.prompt({
  message: "Enter your username",
  placeholder: "e.g. johndoe",
});

if (!cancelled) {
  console.log("Username:", value);
}
```

---

### `Dialog.toast(options)`

Shows a brief, non-blocking toast notification that disappears automatically.

```ts
type ToastDuration = "short" | "long" | number; // number = ms (Android) / s (iOS, normalised)
type ToastPosition = "top" | "center" | "bottom";

interface ToastOptions {
  text: string;
  duration?: ToastDuration;  // Default: "short" (≈ 2 s)
  position?: ToastPosition;  // Default: "bottom"
}

await Dialog.toast({ text: "Changes saved!", duration: "short", position: "bottom" });
// → { shown: true }
```

> **Note**: `toast` resolves immediately after the toast is shown, not after it auto-dismisses — consistent with Flutter's `ScaffoldMessenger.showSnackBar`.

---

## Complete Usage Example

```ts
import { Dialog } from "@wefterjs/dialog";

export async function deleteAccount() {
  // 1. Confirm intent
  const { value: confirmed } = await Dialog.confirm({
    title: "Delete account",
    message: "This action is permanent and cannot be undone.",
    okText: "Delete",
    cancelText: "Keep account",
  });

  if (!confirmed) return;

  // 2. Collect reason via prompt
  const { cancelled, value: reason } = await Dialog.prompt({
    title: "One last thing",
    message: "Why are you leaving? (optional)",
    placeholder: "Your reason",
  });

  if (cancelled) return;

  // 3. Perform deletion … then confirm with toast
  await Dialog.toast({ text: "Account deleted.", duration: "long" });
}
```

---

## Error Handling

Errors surfaced from the native layer are thrown as `WefterBridgeError`:

```ts
import { WefterBridgeError } from "@wefterjs/core";

try {
  await Dialog.toast({ text: "" }); // empty text → INVALID_TEXT
} catch (err) {
  if (err instanceof WefterBridgeError) {
    console.error(err.code, err.message); // "INVALID_TEXT" "toast text must not be empty"
  }
}
```

### Error codes

| Code           | Method  | Cause                            |
|----------------|---------|----------------------------------|
| `INVALID_TEXT` | `toast` | `text` is blank or empty string  |
