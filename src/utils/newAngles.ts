import type { RawStick, StickSample } from '../types';

import { SUB_SLOT_OFFSET, SUB_SLOT_SECTOR } from './stickLayout';

export const CARDINAL_ANGLES = [0, 90, 180, 270] as const;
/** Полуширина сектора sub-слота (= 66° / 2 = 33°) */
export const ANGLE_SECTOR = SUB_SLOT_SECTOR;
export const CARDINAL_SECTION_ANGLE_SECTOR = 45;

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
    if (Math.abs(angleDiff(angle, CARDINAL_ANGLES[i])) <= CARDINAL_SECTION_ANGLE_SECTOR) {
      return i;
    }
  }
  return null;
}

/**
 * Sub-слот по отклонению угла от зафиксированного направления:
 *   0 — главная буква (±33°, как и остальные — полоса 66°)
 *   1 — +66°   2 — −66°   3 — +132°   4 — −132°
 */
export function getSubSlot(currentAngle: number, lockedAngle: number): number | null {
  const diff = angleDiff(currentAngle, lockedAngle);
  if (Math.abs(diff) <= ANGLE_SECTOR) return 0;
  for (const [sub, target] of Object.entries(SUB_SLOT_OFFSET)) {
    if (Math.abs(diff - target) <= ANGLE_SECTOR) {
      return Number(sub);
    }
  }
  return null;
}

/**
 * Преобразует сырые x/y в нормализованный сэмпл.
 * Убирает мёртвую зону, растягивает [deadZone..1] → [0..1], обрезает до 1.
 */
export function normalizeStick(raw: RawStick, deadZone = 0.55): StickSample {
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