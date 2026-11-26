/** Native alerts, confirmations, text prompts and toasts. */

import { definePlugin } from "@wefterjs/core";

/**
 * `short` (about 2 seconds), `long` (about 3.5 seconds), or a time. Numbers up to 60 are seconds; larger
 * numbers are milliseconds.
 */
export type ToastDuration = "short" | "long" | number;
/** Where a toast appears. */
export type ToastPosition = "top" | "center" | "bottom";
/** Keyboard and input style of a prompt. */
export type InputType = "text" | "email" | "password" | "number" | "url" | "tel";

/** Content of an alert with a single button. */
export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
}

/** Returned when the alert is dismissed. */
export interface AlertResult {
  value: true;
}

/** Content of a dialog with OK and Cancel buttons. */
export interface ConfirmOptions {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
}

/** `true` when the user chose OK. */
export interface ConfirmResult {
  value: boolean;
}

/** Content of a dialog that asks for text. */
export interface PromptOptions {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
  placeholder?: string;
  inputType?: InputType;
  defaultValue?: string;
}

/** What the user typed, and whether they cancelled. */
export interface PromptResult {
  cancelled: boolean;
  value: string;
}

/** Text and placement of a toast. */
export interface ToastOptions {
  text: string;
  duration?: ToastDuration;
  position?: ToastPosition;
}

/** Returned once the toast is shown. */
export interface ToastResult {
  shown: true;
}

/** The Dialog plugin. */
export const Dialog = definePlugin<{
  /** Shows an alert and resolves when it is dismissed. */
  alert: (options: AlertOptions) => Promise<AlertResult>;
  /** Asks the user to confirm and resolves with their choice. */
  confirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
  /** Asks the user for text. */
  prompt: (options: PromptOptions) => Promise<PromptResult>;
  /** Shows a brief message that disappears by itself. */
  toast: (options: ToastOptions) => Promise<ToastResult>;
}>("dialog", {
  alert: true,
  confirm: true,
  prompt: true,
  toast: true,
});
