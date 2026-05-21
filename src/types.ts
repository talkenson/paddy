import type { StickResult } from './utils/getStickAngle';

export type GamepadUpdatePayload = Gamepad & {
  l: [number, number];
  r: [number, number];
  lAngle: StickResult;
  rAngle: StickResult;
};

export type GamepadUpdateFunction = (gamepad: GamepadUpdatePayload) => void;

// ─── Raw input ───────────────────────────────────────────────────────────────

/** Сырые данные от геймпада, x/y ∈ [−1, 1] */
export interface RawStick {
  x: number;
  y: number;
  timestamp: number; // performance.now()
}

// ─── Processed stick sample ──────────────────────────────────────────────────

/** Нормализованный сэмпл после dead-zone / clamp */
export interface StickSample {
  angle: number;      // 0–360, 0 = вверх
  magnitude: number;  // 0–1
  active: boolean;    // false = в мёртвой зоне
  timestamp: number;
}

// ─── Stick processor ─────────────────────────────────────────────────────────

export type StickPhase = 'idle' | 'direction_locked' | 'committed';

export interface StickProcessorState {
  phase: StickPhase;
  lockedDirectionIndex: number | null;  // 0=UP 1=RIGHT 2=DOWN 3=LEFT
  lockedDirectionAngle: number | null;
  lockTimestamp: number | null;
  magnitude: number;
}

/** Событие: стик выбрал слот */
export interface StickSlotEvent {
  slot: number;          // 0–19
  directionIndex: number;
  subSlot: number;       // 0=release 1..4=gesture
}

/** Событие: стик вернулся в нейтраль (был active, стал !active) */
export interface StickNeutralEvent {
  type: 'neutral';
}

// ─── Syllable composer ───────────────────────────────────────────────────────

export interface ComposerState {
  heldConsonant: string | null;
  vowelFiredWhileHeld: boolean;
}

// ─── Top-level events ────────────────────────────────────────────────────────

/** Слог или одиночный символ готов к вставке в текст */
export interface CharEvent {
  type: 'char';
  text: string;           // "ПА", "Р", "А" и т.д.
}

/** Отладочное событие — стик зафиксировал слот */
export interface SlotFiredEvent {
  type: 'slot_fired';
  stick: 'left' | 'right';
  slot: number;
  directionIndex: number;
  subSlot: number;
}

export type GamepadEvent = CharEvent | SlotFiredEvent;

// ─── Tick result ─────────────────────────────────────────────────────────────

/** Всё что возвращает GamepadProcessor за один тик */
export interface TickResult {
  events: GamepadEvent[];
  state: {
    left: StickProcessorState;
    right: StickProcessorState;
    composer: ComposerState;
  };
}

// ─── Options ─────────────────────────────────────────────────────────────────

export interface StickOptions {
  /** Радиус мёртвой зоны, default 0.12 */
  deadZone?: number;
  /** Порог входа в направление, default 0.4 */
  directionThreshold?: number;
  /** Порог sub-gesture, default 0.9 */
  gestureThreshold?: number;
  /** Минимальное удержание перед регистрацией жеста, мс, default 80 */
  minHoldMs?: number;
}