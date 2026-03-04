"use client";

import { useEffect } from "react";

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  /** If true, shortcut fires even when an input/textarea is focused */
  global?: boolean;
}

/**
 * Register keyboard shortcuts for the timeline and other views.
 *
 * Usage:
 *   useKeyboardShortcuts([
 *     { key: "n", handler: () => console.log("new scene") },
 *     { key: "Escape", handler: () => closePanel(), global: true },
 *     { key: "s", ctrl: true, handler: () => save() },
 *   ]);
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in an input or textarea (unless global)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (!shortcut.global && isInput) continue;

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : true;
        const metaMatch = shortcut.meta ? e.metaKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        // Don't fire single-key shortcuts if modifier is held (unless specified)
        if (
          !shortcut.ctrl &&
          !shortcut.meta &&
          (e.ctrlKey || e.metaKey)
        )
          continue;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
