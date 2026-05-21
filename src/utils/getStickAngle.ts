import type { StickOptions, StickSample } from "../types";

export function getStickAngle(
  x: number,
  y: number,
  timestamp: number,
  options: StickOptions = {}
): StickSample {
  const { deadZone = 0.15 } = options;

  const rawMagnitude = Math.sqrt(x * x + y * y);

  // Стик в мёртвой зоне
  if (rawMagnitude < deadZone) {
    return { angle: 0, magnitude: 0, active: false, timestamp };
  }

  // Нормализуем magnitude: убираем мёртвую зону и растягиваем [deadZone..1] → [0..1]
  const finalMagnitude = Math.min((rawMagnitude - deadZone) / (1 - deadZone), 1);

  // Нормализуем вектор и вычисляем угол
  const nx = x / rawMagnitude;
  const ny = y / rawMagnitude;

  const radians = Math.atan2(nx, -ny);
  const angle = ((radians * 180) / Math.PI + 360) % 360;

  return { angle, magnitude: finalMagnitude, active: true, timestamp };
}
