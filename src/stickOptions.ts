import type { StickOptions } from './types';

export const DEFAULT_STICK_OPTIONS: Required<
  Pick<StickOptions, 'backHoldMs' | 'disableDirectionMs'>
> = {
  backHoldMs: 200,
  disableDirectionMs: 500,
};

const STORAGE_KEY = 'paddy-stick-options';

export type StickTimingOptions = typeof DEFAULT_STICK_OPTIONS;

export function loadStickTimingOptions(): StickTimingOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STICK_OPTIONS };
    return { ...DEFAULT_STICK_OPTIONS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STICK_OPTIONS };
  }
}

export function saveStickTimingOptions(options: StickTimingOptions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
}
