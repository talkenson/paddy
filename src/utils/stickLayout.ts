/** Позиция на круге: угол 0° = вверх, по часовой */
export function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad) * radius,
    y: -Math.cos(rad) * radius,
  };
}

/** Угол для sub-слота относительно зафиксированного направления */
export function subSlotAngle(lockedAngle: number, subSlot: number): number {
  const offsets: Record<number, number> = {
    0: 0,
    1: 45,
    2: -45,
    3: 90,
    4: -90,
  };
  return (lockedAngle + (offsets[subSlot] ?? 0) + 360) % 360;
}

/** Слоты release для четырёх кардинальных направлений */
export const CARDINAL_RELEASE_SLOTS = [0, 5, 10, 15] as const;
