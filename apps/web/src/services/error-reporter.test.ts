import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reportError,
  getErrorLog,
  clearErrorLog,
  initErrorReporter,
} from "./error-reporter";

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};
vi.stubGlobal("localStorage", localStorageMock);

describe("error-reporter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe("reportError", () => {
    it("logs error to console", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      reportError("api", "Something failed", { endpoint: "/test" });
      expect(consoleSpy).toHaveBeenCalledWith(
        "[CSS Mountain api]",
        "Something failed",
        expect.objectContaining({ endpoint: "/test" }),
      );
      consoleSpy.mockRestore();
    });

    it("persists error to localStorage", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      reportError("api", "Something failed");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "css-mountain:error-log",
        expect.any(String),
      );
    });

    it("stores error with correct structure", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      reportError("render", new Error("Component crashed"), {
        component: "MapScreen",
      });

      const log = JSON.parse(
        mockStorage["css-mountain:error-log"],
      );
      expect(log).toHaveLength(1);
      expect(log[0]).toEqual(
        expect.objectContaining({
          category: "render",
          message: "Component crashed",
          context: expect.objectContaining({ component: "MapScreen" }),
        }),
      );
      expect(log[0].stack).toBeDefined();
    });

    it("handles Error objects with stack traces", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Test error");
      reportError("unhandled", error);

      const log = JSON.parse(
        mockStorage["css-mountain:error-log"],
      );
      expect(log[0].stack).toContain("Error: Test error");
    });

    it("handles string error messages", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      reportError("network", "Connection timeout");

      const log = JSON.parse(
        mockStorage["css-mountain:error-log"],
      );
      expect(log[0].message).toBe("Connection timeout");
      expect(log[0].stack).toBeNull();
    });
  });

  describe("getErrorLog", () => {
    it("returns empty array when no errors logged", () => {
      expect(getErrorLog()).toEqual([]);
    });

    it("returns stored errors", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      reportError("api", "Error 1");
      reportError("render", "Error 2");

      const log = getErrorLog();
      expect(log).toHaveLength(2);
      expect(log[0].message).toBe("Error 1");
      expect(log[1].message).toBe("Error 2");
    });
  });

  describe("clearErrorLog", () => {
    it("removes the error log from storage", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      reportError("api", "Error");
      clearErrorLog();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "css-mountain:error-log",
      );
    });
  });

  describe("initErrorReporter", () => {
    it("returns a cleanup function", () => {
      const cleanup = initErrorReporter();
      expect(typeof cleanup).toBe("function");
      cleanup();
    });

    it("adds event listeners", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const cleanup = initErrorReporter();

      expect(addSpy).toHaveBeenCalledWith("error", expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );

      cleanup();
      addSpy.mockRestore();
    });

    it("removes event listeners on cleanup", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const cleanup = initErrorReporter();
      cleanup();

      expect(removeSpy).toHaveBeenCalledWith("error", expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );

      removeSpy.mockRestore();
    });
  });
});
