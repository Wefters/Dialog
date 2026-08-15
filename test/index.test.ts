// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { installMockBridge, uninstallMockBridge } from "@wefterjs/core/testing";
import { WefterBridgeError } from "@wefterjs/core";
import { Dialog } from "../src/index.js";

afterEach(() => {
  uninstallMockBridge();
});

describe("Dialog.alert", () => {
  it("resolves with { value: true } when the user taps OK", async () => {
    installMockBridge({
      dialog: (method, payload) => {
        expect(method).toBe("alert");
        expect(payload).toMatchObject({ message: "Hello!" });
        return { value: true };
      },
    });

    const result = await Dialog.alert({ message: "Hello!" });
    expect(result).toEqual({ value: true });
  });

  it("forwards optional title and buttonText", async () => {
    installMockBridge({
      dialog: (_method, payload) => {
        expect(payload).toEqual({
          message: "Are you sure?",
          title: "Confirm",
          buttonText: "Got it",
        });
        return { value: true };
      },
    });

    await Dialog.alert({
      message: "Are you sure?",
      title: "Confirm",
      buttonText: "Got it",
    });
  });
});

describe("Dialog.confirm", () => {
  it("resolves { value: true } on OK", async () => {
    installMockBridge({
      dialog: (method) => {
        expect(method).toBe("confirm");
        return { value: true };
      },
    });

    const result = await Dialog.confirm({ message: "Delete this file?" });
    expect(result).toEqual({ value: true });
  });

  it("resolves { value: false } on Cancel", async () => {
    installMockBridge({
      dialog: () => ({ value: false }),
    });

    const result = await Dialog.confirm({ message: "Are you sure?" });
    expect(result).toEqual({ value: false });
  });

  it("forwards okText and cancelText", async () => {
    installMockBridge({
      dialog: (_method, payload) => {
        expect(payload).toMatchObject({ okText: "Yes", cancelText: "No" });
        return { value: true };
      },
    });

    await Dialog.confirm({
      message: "Proceed?",
      okText: "Yes",
      cancelText: "No",
    });
  });
});

describe("Dialog.prompt", () => {
  it("resolves with cancelled:false and the typed value when OK is tapped", async () => {
    installMockBridge({
      dialog: (method) => {
        expect(method).toBe("prompt");
        return { cancelled: false, value: "Alice" };
      },
    });

    const result = await Dialog.prompt({ message: "Enter your name" });
    expect(result).toEqual({ cancelled: false, value: "Alice" });
  });

  it("resolves with cancelled:true and empty string on Cancel", async () => {
    installMockBridge({
      dialog: () => ({ cancelled: true, value: "" }),
    });

    const result = await Dialog.prompt({ message: "Enter something" });
    expect(result).toEqual({ cancelled: true, value: "" });
  });

  it("forwards all prompt options to native", async () => {
    installMockBridge({
      dialog: (_method, payload) => {
        expect(payload).toEqual({
          message: "Password",
          title: "Login",
          okText: "Submit",
          cancelText: "Back",
          placeholder: "••••••",
          inputType: "password",
          defaultValue: "",
        });
        return { cancelled: false, value: "s3cr3t" };
      },
    });

    await Dialog.prompt({
      message: "Password",
      title: "Login",
      okText: "Submit",
      cancelText: "Back",
      placeholder: "••••••",
      inputType: "password",
      defaultValue: "",
    });
  });
});

describe("Dialog.toast", () => {
  it("resolves with { shown: true }", async () => {
    installMockBridge({
      dialog: (method) => {
        expect(method).toBe("toast");
        return { shown: true };
      },
    });

    const result = await Dialog.toast({ text: "Saved!" });
    expect(result).toEqual({ shown: true });
  });

  it("forwards text, duration, and position", async () => {
    installMockBridge({
      dialog: (_method, payload) => {
        expect(payload).toEqual({
          text: "Done",
          duration: "long",
          position: "top",
        });
        return { shown: true };
      },
    });

    await Dialog.toast({ text: "Done", duration: "long", position: "top" });
  });

  it("accepts a numeric duration", async () => {
    installMockBridge({
      dialog: (_method, payload) => {
        expect((payload as { duration: number }).duration).toBe(3000);
        return { shown: true };
      },
    });

    await Dialog.toast({ text: "Custom", duration: 3000 });
  });
});

describe("error propagation", () => {
  it("surfaces a native rejection as a WefterBridgeError", async () => {
    installMockBridge({
      dialog: () => {
        throw new Error("toast text must not be empty");
      },
    });

    const call = Dialog.toast({ text: "" });

    await expect(call).rejects.toBeInstanceOf(WefterBridgeError);
    await expect(call).rejects.toMatchObject({
      code: "MOCK_ERROR",
      message: "toast text must not be empty",
    });
  });
});
