/** Позиция на круге: угол 0° = вверх, по часовой */
export function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad) * radius,
    y: -Math.cos(rad) * radius,
  };
}

/**
 * Углы жестов (sub 1–4) от зафиксированного направления.
 * Используются и в StickProcessor/getSubSlot, и в UI.
 * Бывшие ±45° / ±90° → ~66° (60–72) и ~132° (120–144).
 */
export const SUB_SLOT_OFFSET: Record<number, number> = {
  1: 66,
  2: -66,
  3: 132,
  4: -132,
};

/** Расстояние между соседними целями (0↔66, 66↔132) */
export const SUB_SLOT_SPACING = 66;

/** Полуширина сектора: каждый слот занимает SUB_SLOT_SPACING градусов */
export const SUB_SLOT_SECTOR = SUB_SLOT_SPACING / 2;

export function subSlotGestureAngle(lockedAngle: number, subSlot: number): number {
  if (subSlot === 0) return (lockedAngle + 360) % 360;
  const offset = SUB_SLOT_OFFSET[subSlot] ?? 0;
  return (lockedAngle + offset + 360) % 360;
}

/** Слоты release для четырёх кардинальных направлений */
export const CARDINAL_RELEASE_SLOTS = [0, 5, 10, 15] as const;
