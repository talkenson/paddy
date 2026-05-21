import type { RawStick, StickSample } from './types';

export const CARDINAL_ANGLES = [0, 90, 180, 270] as const;
export const ANGLE_SECTOR    = 22.5; // ±22.5° на каждое направление

/** Разница углов в диапазоне (−180, 180] */
export function angleDiff(a: number, b: number): number {
  let d = ((a - b) % 360 + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

/**
 * Ближайшее кардинальное направление, или null если вне сектора.
 * Индексы: 0=UP(0°) 1=RIGHT(90°) 2=DOWN(180°) 3=LEFT(270°)
 */
export function getCardinalIndex(angle: number): number | null {
  for (let i = 0; i < CARDINAL_ANGLES.length; i++) {
    if (Math.abs(angleDiff(angle, CARDINAL_ANGLES[i])) <= ANGLE_SECTOR) {
      return i;
    }
  }
  return null;
}

/**
 * Sub-слот по отклонению угла от зафиксированного направления:
 *   0 — release (обрабатывается отдельно в StickProcessor)
 *   1 — +45°  (по часовой)
 *   2 — −45°  (против часовой)
 *   3 — +90°
 *   4 — −90°
 */
export function getSubSlot(currentAngle: number, lockedAngle: number): number | null {
  const diff = angleDiff(currentAngle, lockedAngle);
  if (Math.abs(diff -  45) <= ANGLE_SECTOR) return 1;
  if (Math.abs(diff +  45) <= ANGLE_SECTOR) return 2;
  if (Math.abs(diff -  90) <= ANGLE_SECTOR) return 3;
  if (Math.abs(diff +  90) <= ANGLE_SECTOR) return 4;
  return null;
}

/**
 * Преобразует сырые x/y в нормализованный сэмпл.
 * Убирает мёртвую зону, растягивает [deadZone..1] → [0..1], обрезает до 1.
 */
export function normalizeStick(raw: RawStick, deadZone = 0.12): StickSample {
  const rawMag = Math.sqrt(raw.x * raw.x + raw.y * raw.y);

  if (rawMag < deadZone) {
    return { angle: 0, magnitude: 0, active: false, timestamp: raw.timestamp };
  }

  const normalizedMag = Math.min((rawMag - deadZone) / (1 - deadZone), 1);
  const nx = raw.x / rawMag;
  const ny = raw.y / rawMag;

  const radians = Math.atan2(nx, -ny);
  const angle   = ((radians * 180) / Math.PI + 360) % 360;

  return { angle, magnitude: normalizedMag, active: true, timestamp: raw.timestamp };
}