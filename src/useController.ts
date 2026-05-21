import { useEffect, useRef, useState } from 'react';
import { useGamepad } from './useGamepad';
import type { GamepadUpdatePayload } from './types';

export const useController = () => {
  const { gamepad, onGamepadUpdate } = useGamepad();
  const [currentState, setCurrentState] = useState<GamepadUpdatePayload>(null);

  useEffect(() => {
    if (!gamepad) return;
    const unsub = onGamepadUpdate((update) => {
      // console.log(update);
      setCurrentState(update);
    });

    return unsub;
  }, [gamepad]);

  return { gamepad, currentState };
};
