import { useEffect, useRef, useState } from 'react';
import { useGamepad } from './useGamepad';
import type { GamepadUpdatePayload, TickResult } from './types';
import { GamepadProcessor } from './utils/composer';

export const useController = ({addChars}: {addChars: (chars: string[]) => void}) => {
  const { gamepad, onGamepadUpdate } = useGamepad();
  const processor = useRef(new GamepadProcessor());
  const [currentState, setCurrentState] = useState<GamepadUpdatePayload | null>(null);
  const [tickResult, setTickResult] = useState<TickResult | null>(null);

  useEffect(() => {
    if (!gamepad) {
      processor.current.reset();
      setCurrentState(null);
      setTickResult(null);
      return;
    }

    const unsub = onGamepadUpdate((update) => {
      setCurrentState(update);
      const result = processor.current.tick(update.lSample, update.rSample, update.pressedButtons);
      setTickResult(result);
      const chars = result.events
        .filter((e) => e.type === 'char')
        .map((e) => e.text);

      if (chars.length > 0) {
        addChars(chars)
      }
    });

    return unsub;
  }, [gamepad, onGamepadUpdate]);

  return { gamepad, currentState, tickResult };
};
