"use client";

// WP3.2 — localStorage-backed store with zod validation and immutable updates.
import { useCallback, useEffect, useState } from "react";
import { appStateSchema, initialAppState } from "./types";
import type { AppState } from "./types";

const STORAGE_KEY = "preventos.app.v1";

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialAppState;
    const parsed = appStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : initialAppState;
  } catch {
    return initialAppState;
  }
}

function persist(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — state stays in memory for the session
  }
}

export function clearAppState(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export interface AppStore {
  readonly state: AppState;
  readonly hydrated: boolean;
  readonly update: (updater: (current: AppState) => AppState) => void;
  readonly erase: () => void;
}

export function useAppStore(): AppStore {
  const [state, setState] = useState<AppState>(initialAppState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadAppState());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
  }, []);

  const erase = useCallback(() => {
    clearAppState();
    setState(initialAppState);
  }, []);

  return { state, hydrated, update, erase };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
