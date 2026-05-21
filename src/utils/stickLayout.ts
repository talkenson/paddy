/** Позиция на круге: угол 0° = вверх, по часовой */
export function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad) * radius,
    y: -Math.cos(rad) * radius,
  };
}

/** Маркер зоны «назад» в getSubSlot (не слот маппинга) */
export const SUB_SLOT_BACK = -1;

export const BACK_OFFSET = 180;

/**
 * Углы букв sub 1–4 от lock. Сектор каждого — 60° (±30°).
 * «Назад» — отдельно на BACK_OFFSET (180°).
 */
export const SUB_SLOT_OFFSET: Record<number, number> = {
  1: 60,
  2: -60,
  3: 120,
  4: -120,
};

export const SUB_SLOT_SPACING = 60;
export const SUB_SLOT_SECTOR = SUB_SLOT_SPACING / 2;

export function subSlotGestureAngle(lockedAngle: number, subSlot: number): number {
  if (subSlot === 0) return (lockedAngle + 360) % 360;
  const offset = SUB_SLOT_OFFSET[subSlot] ?? 0;
  return (lockedAngle + offset + 360) % 360;
}

export function backGestureAngle(lockedAngle: number): number {
  return (lockedAngle + BACK_OFFSET) % 360;
}

/** Слоты release для четырёх кардинальных направлений */
export const CARDINAL_RELEASE_SLOTS = [0, 5, 10, 15] as const;
