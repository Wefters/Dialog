# @wefterjs/dialog

Official Wefter plugin for native alert, confirm, prompt, and toast dialogs on Android and iOS.

## Features

- Native modal alerts with customizable dismiss buttons.
- Binary confirm dialogs returning boolean results.
- Single-line prompt dialogs with configurable keyboard input types.
- Lightweight auto-dismissing toast notifications with positioning options.
- Zero runtime permissions required.

## Installation and setup

Install the plugin package in your Wefter application:

```bash
wefter add @wefterjs/dialog
wefter sync
```

## JavaScript API reference

Import `Dialog` from `@wefterjs/dialog`:

```ts
import { Dialog } from "@wefterjs/dialog";
```

### Alert dialog

Displays a modal dialog with a single button:

```ts
await Dialog.alert({
  title: "Notice",
  message: "Your settings have been saved.",
  buttonText: "OK", // Optional, defaults to "OK"
});
```

Resolves with `{ value: true }` when the user dismisses the dialog.

### Confirm dialog

Displays a two-button dialog for confirmation:

```ts
const { value } = await Dialog.confirm({
  title: "Delete item",
  message: "Are you sure you want to delete this file?",
  okText: "Delete", // Optional, defaults to "OK"
  cancelText: "Cancel", // Optional, defaults to "Cancel"
});

if (value) {
  console.log("User confirmed deletion");
} else {
  console.log("User cancelled");
}
```

Resolves with `{ value: true }` if the positive button was tapped, and `{ value: false }` if cancelled.

### Prompt dialog

Displays a modal input dialog to collect user text:

```ts
const result = await Dialog.prompt({
  title: "Update profile",
  message: "Enter your contact email address:",
  placeholder: "name@example.com",
  defaultValue: "current@example.com",
  inputType: "email", // "text", "email", "password", "number", "url", or "tel"
  okText: "Save",
  cancelText: "Cancel",
});

if (!result.cancelled) {
  console.log("Entered email:", result.value);
} else {
  console.log("Prompt dismissed by user");
}
```

### Toast notification

Displays a non-blocking notification that auto-dismisses:

```ts
await Dialog.toast({
  text: "Copied to clipboard",
  duration: "short", // "short", "long", or milliseconds number
  position: "bottom", // "top", "center", or "bottom"
});
```

The toast call resolves immediately once the notification is displayed on screen, rather than waiting for dismissal.

## Error handling

If invalid options are provided (such as an empty toast string), the call rejects with a `WefterBridgeError`:

```ts
import { WefterBridgeError } from "@wefterjs/core";

try {
  await Dialog.toast({ text: "" });
} catch (error) {
  if (error instanceof WefterBridgeError) {
    console.error("Error code:", error.code); // "INVALID_TEXT"
    console.error("Error message:", error.message);
  }
}
```

## Platform implementation notes

### Android

- Dialogs (`alert`, `confirm`, `prompt`) use `androidx.appcompat.app.AlertDialog.Builder`.
- The `prompt` input uses an `AppCompatEditText` configured with appropriate `InputType` flags matching `inputType`.
- `toast` uses standard `android.widget.Toast`.

### iOS

- Dialogs (`alert`, `confirm`, `prompt`) use `UIAlertController` presented with `.alert` style on the root view controller.
- `prompt` adds a `UITextField` configured with corresponding `UIKeyboardType` and `isSecureTextEntry` properties.
- `toast` creates a temporary `UILabel` overlay with animated alpha transitions.

## License

[MIT](LICENSE) © 2026 Sandip Ghimire
