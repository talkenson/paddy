import type {
  StickOptions,
  StickPhase,
  StickProcessorState,
  StickSample,
  StickSlotEvent,
} from '../types';
import { CARDINAL_ANGLES, getCardinalIndex, getSubSlot } from './newAngles';

export class StickProcessor {
  private phase: StickPhase = 'idle';
  private lockedDirectionIndex: number | null = null;
  private lockedDirectionAngle: number | null = null;
  private lockTimestamp: number | null = null;
  private wasActive = false;
  private lastMagnitude = 0;
  /** Последний зафиксированный жест; меняется при проведении мимо промежуточных слотов */
  private lastSubSlot: number | null = null;

  private options: StickOptions;

  constructor(options: StickOptions = {}) {
    this.options = options;
  }

  process(sample: StickSample): StickSlotEvent | null {
    const directionThreshold = this.options.directionThreshold ?? 0.4;
    const gestureThreshold = this.options.gestureThreshold ?? 0.9;
    const minHoldMs = this.options.minHoldMs ?? 80;

    if (this.wasActive && !sample.active) {
      // Release (базовый слот) только если направление зафиксировали, но жеста не было
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
      this.reset();
      this.wasActive = false;
      return release;
    }

    this.wasActive = sample.active;
    this.lastMagnitude = sample.magnitude;

    if (!sample.active) return null;

    if (this.phase === 'idle') {
      const dirIndex = getCardinalIndex(sample.angle);
      if (dirIndex !== null && sample.magnitude >= directionThreshold) {
        this.phase = 'direction_locked';
        this.lockedDirectionIndex = dirIndex;
        this.lockedDirectionAngle = CARDINAL_ANGLES[dirIndex];
        this.lockTimestamp = sample.timestamp;
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
    };
  }

  reset(): void {
    this.phase = 'idle';
    this.lockedDirectionIndex = null;
    this.lockedDirectionAngle = null;
    this.lockTimestamp = null;
    this.lastSubSlot = null;
  }
}
