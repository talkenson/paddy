import { useCallback, useEffect, useRef, useState } from 'react';
import type { GamepadUpdateFunction, GamepadUpdatePayload } from './types';
import { normalizeStick } from './utils/newAngles';

const gamepadUpdateLoop = (
  index: number,
  listeners: Set<GamepadUpdateFunction>,
) => {
  const timer = setInterval(() => {
    const gamepad = navigator.getGamepads()?.[index];
    if (!gamepad || !gamepad.connected) {
      clearInterval(timer);
      return;
    }
    
    const now = performance.now();
    const updateData: GamepadUpdatePayload = {
      ...gamepad,
      l: [gamepad.axes[0], gamepad.axes[1]],
      r: [gamepad.axes[2], gamepad.axes[3]],
      lSample: normalizeStick({ x: gamepad.axes[0], y: gamepad.axes[1], timestamp: now }),
      rSample: normalizeStick({ x: gamepad.axes[2], y: gamepad.axes[3], timestamp: now }),
      pressedButtons: gamepad.buttons.map((b, i) => ({pressed: b.pressed, i})).filter(b => b.pressed).map(b => b.i).reduce((a, v) => a | 1<<v, 0b0)
    };

    listeners.forEach((fn) => fn(updateData));
  }, 16);
};

export const useGamepad = () => {
  const controllers = useRef(navigator.getGamepads());
  const [selectedGamepad, setSelectedGamepad] = useState<Gamepad | null>(null);
  const listeners = useRef(new Set<GamepadUpdateFunction>());

  useEffect(() => {
    const onConnect = (e: GamepadEvent) => {
      controllers.current = navigator.getGamepads();
      const connectedGamepadIndex = e.gamepad.index;
      const gp = controllers.current[connectedGamepadIndex];
      if (!gp) return;

      setSelectedGamepad(gp);
      console.log(
        `Gamepad connected at index ${gp.index}: ${gp.id} with ${gp.buttons.length} buttons, ${gp.axes.length} axes.`,
      );
      gamepadUpdateLoop(connectedGamepadIndex, listeners.current);
    };

    const onDisconnect = () => {
      setSelectedGamepad(null);
    };

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (selectedGamepad === null) return;

    console.log('Gamepad connected');
    console.log(selectedGamepad);

    return () => {
      console.log('Gamepad disconnected');
    };
  }, [selectedGamepad]);

  const onGamepadUpdate = useCallback((fn: GamepadUpdateFunction) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  return {
    gamepad: selectedGamepad,
    onGamepadUpdate,
  };
};
