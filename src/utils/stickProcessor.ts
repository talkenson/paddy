import type {
  StickOptions,
  StickPhase,
  StickProcessorState,
  StickSample,
  StickSlotEvent,
} from '../types';
import { SUB_SLOT_BACK } from './stickLayout';
import { CARDINAL_ANGLES, getCardinalIndex, getSubSlot } from './newAngles';

const BACK_HOLD_MS = 300;
const DISABLE_DIRECTION_MS = 800;

export function oppositeDirectionIndex(from: number): number {
  return (from + 2) % 4;
}

export class StickProcessor {
  private phase: StickPhase = 'idle';
  private lockedDirectionIndex: number | null = null;
  private lockedDirectionAngle: number | null = null;
  private lockTimestamp: number | null = null;
  private wasActive = false;
  private lastMagnitude = 0;
  private lastSubSlot: number | null = null;
  private backHoldStart: number | null = null;
  private backHoldProgress: number | null = null;
  /** После «назад» — только противоположное направление (index + 2) */
  private disabledDirectionIndex: number | null = null;
  private disabledUntilTimestamp: number | null = null;
  private pendingBack = false;

  private options: StickOptions;

  constructor(options: StickOptions = {}) {
    this.options = options;
  }

  setOptions(options: StickOptions): void {
    this.options = { ...this.options, ...options };
  }

  process(sample: StickSample): StickSlotEvent | null {
    const directionThreshold = this.options.directionThreshold ?? 0.6;
    const gestureThreshold = this.options.gestureThreshold ?? 0.92;
    const minHoldMs = this.options.minHoldMs ?? 80;
    const backHoldMs = this.options.backHoldMs ?? BACK_HOLD_MS;
    const disableMs = this.options.disableDirectionMs ?? DISABLE_DIRECTION_MS;

    this.updateDisabledDirection(sample);

    if (this.wasActive && !sample.active) {
      this.backHoldStart = null;
      this.backHoldProgress = null;

      const release =
        this.phase === 'direction_locked' &&
        this.lockedDirectionIndex !== null &&
        this.lastSubSlot === null
          ? {
              slot: this.lockedDirectionIndex * 5,
              directionIndex: this.lockedDirectionIndex,
              subSlot: 0,
            }
          : null;

      this.resetLock();
      this.wasActive = false;
      return release;
    }

    this.wasActive = sample.active;
    this.lastMagnitude = sample.magnitude;

    if (!sample.active) return null;

    if (this.phase === 'idle') {
      const dirIndex = getCardinalIndex(sample.angle);
      if (
        dirIndex !== null &&
        dirIndex !== this.disabledDirectionIndex &&
        sample.magnitude >= directionThreshold
      ) {
        this.phase = 'direction_locked';
        this.lockedDirectionIndex = dirIndex;
        this.lockedDirectionAngle = CARDINAL_ANGLES[dirIndex];
        this.lockTimestamp = sample.timestamp;
        this.lastSubSlot = null;
        this.backHoldStart = null;
      }
      return null;
    }

    if (this.phase === 'direction_locked') {
      const heldMs = sample.timestamp - (this.lockTimestamp ?? sample.timestamp);
      if (heldMs < minHoldMs) return null;

      if (
        sample.magnitude >= gestureThreshold &&
        this.lockedDirectionAngle !== null &&
        this.lockedDirectionIndex !== null
      ) {
        const subSlot = getSubSlot(sample.angle, this.lockedDirectionAngle);

        if (subSlot === SUB_SLOT_BACK) {
          if (this.backHoldStart === null) {
            this.backHoldStart = sample.timestamp;
          }
          this.backHoldProgress = Math.min(
            1,
            (sample.timestamp - this.backHoldStart) / backHoldMs,
          );
          if (sample.timestamp - this.backHoldStart >= backHoldMs) {
            const from = this.lockedDirectionIndex;
            this.disabledDirectionIndex = oppositeDirectionIndex(from);
            this.disabledUntilTimestamp = sample.timestamp + disableMs;
            this.resetLock();
            this.backHoldStart = null;
            this.backHoldProgress = null;
            this.pendingBack = true;
          }
          return null;
        }

        this.backHoldStart = null;
        this.backHoldProgress = null;

        if (subSlot !== null && subSlot !== this.lastSubSlot) {
          this.lastSubSlot = subSlot;
          return {
            slot: this.lockedDirectionIndex * 5 + subSlot,
            directionIndex: this.lockedDirectionIndex,
            subSlot,
          };
        }
      }
    }

    return null;
  }

  private updateDisabledDirection(sample: StickSample): void {
    if (this.disabledDirectionIndex === null) return;

    if (
      this.disabledUntilTimestamp !== null &&
      sample.timestamp >= this.disabledUntilTimestamp
    ) {
      this.clearDisabledDirection();
      return;
    }

    if (sample.active) {
      const cardinal = getCardinalIndex(sample.angle);
      if (cardinal !== this.disabledDirectionIndex) {
        this.clearDisabledDirection();
      }
    }
  }

  private clearDisabledDirection(): void {
    this.disabledDirectionIndex = null;
    this.disabledUntilTimestamp = null;
  }

  getState(): StickProcessorState {
    const phase: StickPhase =
      this.phase === 'direction_locked' && this.lastSubSlot !== null
        ? 'committed'
        : this.phase;

    return {
      phase,
      lockedDirectionIndex: this.lockedDirectionIndex,
      lockedDirectionAngle: this.lockedDirectionAngle,
      lockTimestamp: this.lockTimestamp,
      magnitude: this.lastMagnitude,
      disabledDirectionIndex: this.disabledDirectionIndex,
      backHoldProgress: this.backHoldProgress,
    };
  }

  consumeBack(): boolean {
    const v = this.pendingBack;
    this.pendingBack = false;
    return v;
  }

  private resetLock(): void {
    this.phase = 'idle';
    this.lockedDirectionIndex = null;
    this.lockedDirectionAngle = null;
    this.lockTimestamp = null;
    this.lastSubSlot = null;
    this.backHoldStart = null;
  }

  reset(): void {
    this.resetLock();
    this.clearDisabledDirection();
    this.backHoldProgress = null;
  }
}
