import { useCallback, useEffect, useRef, useState } from 'react';
import type { GamepadUpdateFunction, GamepadUpdatePayload } from './types';
import { getStickAngle } from './utils/getStickAngle';

const gamepadUpdateLoop = (
  index: number,
  listeners: Set<GamepadUpdateFunction>
) => {
  // while (true) {
  const timer = setInterval(() => {
    const gamepad = navigator.getGamepads()?.[index];
    if (!gamepad || !gamepad.connected) clearInterval(timer);

    const updateData: GamepadUpdatePayload = {
      ...gamepad,
      l: [gamepad.axes[0], gamepad.axes[1]],
      r: [gamepad.axes[2], gamepad.axes[3]],
      lAngle: getStickAngle(gamepad.axes[0], gamepad.axes[1]),
      rAngle: getStickAngle(gamepad.axes[2], gamepad.axes[3]),
    };

    listeners.forEach((fn) => fn(updateData));
  }, 16);
  // }
};

export const useGamepad = () => {
  const controllers = useRef(navigator.getGamepads());
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState<
    number | null
  >();
  const [selectedGamepad, setSelectedGamepad] = useState<Gamepad | null>(null);
  const listeners = useRef(new Set<GamepadUpdateFunction>());

  useEffect(() => {
    const onConnect = (e: GamepadEvent) => {
      controllers.current = navigator.getGamepads();
      const connectedGamepadIndex = e.gamepad.index;
      setSelectedGamepad(controllers.current[connectedGamepadIndex]);
      setSelectedGamepadIndex(connectedGamepadIndex);
      const gp = controllers.current[connectedGamepadIndex];
      console.log(
        `Gamepad connected at index ${gp.index}: ${gp.id} with ${gp.buttons.length} buttons, ${gp.axes.length} axes.`
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
      window.addEventListener('gamepaddisconnected', onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (selectedGamepad === null || selectedGamepadIndex === null) return;

    console.log('Gamepad connected');
    console.log(selectedGamepad);

    return () => {
      console.log('Gamepad disconnected');
    };
  }, [selectedGamepad, selectedGamepadIndex]);

  const onGamepadUpdate = useCallback((fn: GamepadUpdateFunction) => {
    console.log('setting listener');
    listeners.current.add(fn);

    return () => {
      console.log('unsetting listener');
      listeners.current.delete(fn);
    };
  }, []);

  return {
    gamepad: selectedGamepad,
    onGamepadUpdate,
  };
};
