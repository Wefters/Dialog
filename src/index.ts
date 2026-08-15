import { definePlugin } from "@wefterjs/core";

export type ToastDuration = "short" | "long" | number;
export type ToastPosition = "top" | "center" | "bottom";
export type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "url"
  | "tel";

export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
}

export interface AlertResult {
  value: true;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
}

export interface ConfirmResult {
  value: boolean;
}

export interface PromptOptions {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
  placeholder?: string;
  inputType?: InputType;
  defaultValue?: string;
}

export interface PromptResult {
  cancelled: boolean;
  value: string;
}

export interface ToastOptions {
  text: string;
  duration?: ToastDuration;
  position?: ToastPosition;
}

export interface ToastResult {
  shown: true;
}

export const Dialog = definePlugin<{
  alert: (options: AlertOptions) => Promise<AlertResult>;
  confirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
  prompt: (options: PromptOptions) => Promise<PromptResult>;
  toast: (options: ToastOptions) => Promise<ToastResult>;
}>("dialog", {
  alert: true,
  confirm: true,
  prompt: true,
  toast: true,
});
