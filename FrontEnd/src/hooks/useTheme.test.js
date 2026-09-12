import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with false (light) by default when localStorage is empty and system is light", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());
    const [isDark] = result.current;

    expect(isDark).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("timetracker-theme")).toBe("light");
  });

  it("initializes with true (dark) when system prefers dark mode", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());
    const [isDark] = result.current;

    expect(isDark).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("timetracker-theme")).toBe("dark");
  });

  it("initializes with saved theme from localStorage over system preference", () => {
    localStorage.setItem("timetracker-theme", "dark");

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
    }));

    const { result } = renderHook(() => useTheme());
    const [isDark] = result.current;

    expect(isDark).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles theme correctly and updates dataset.theme and localStorage", () => {
    localStorage.setItem("timetracker-theme", "light");

    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe(false);

    act(() => {
      const toggle = result.current[1];
      toggle();
    });

    expect(result.current[0]).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("timetracker-theme")).toBe("dark");

    act(() => {
      const toggle = result.current[1];
      toggle();
    });

    expect(result.current[0]).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("timetracker-theme")).toBe("light");
  });
});

