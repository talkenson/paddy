import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { CONSONANTS, VOWELS } from './mappings';
import { StickPad } from './StickPad';
import { TimingControls } from './TimingControls';
import { useController } from './useController';
import {
  loadStickTimingOptions,
  saveStickTimingOptions,
  type StickTimingOptions,
} from './stickOptions';
import { ButtonMap } from './utils/buttonMap';

function App() {
  const [string, setString] = useState('');
  const [timing, setTiming] = useState<StickTimingOptions>(loadStickTimingOptions);

  const addChars = useCallback((chars: string[]) => {
    setString(prev => (prev + chars.join('')).trimStart())
  }, [])

  const clear = useCallback(() => setString(''), [])

  const updateTiming = useCallback((next: StickTimingOptions) => {
    setTiming(next);
    saveStickTimingOptions(next);
  }, []);

  const { gamepad, currentState, tickResult } = useController({
    addChars,
    stickOptions: timing,
  });

  useEffect(() => {
    if ((currentState?.pressedButtons ?? 0) & ButtonMap.BTN_2) {
      clear()
    }
  }, [currentState, clear])

  const leftState = tickResult?.state.left;
  const rightState = tickResult?.state.right;

  return (
    <>
      {gamepad !== null ? (
        <div className="app-layout">
          {currentState && leftState && (
            <StickPad
              title="Согласные"
              sample={currentState.lSample}
              state={leftState}
              mapping={CONSONANTS}
            />
          )}
          {currentState && rightState && (
            <StickPad
              title="Гласные"
              sample={currentState.rSample}
              state={rightState}
              mapping={VOWELS}
            />
          )}
          <div className="text-panel">
            <div style={{ fontSize: 13, opacity: 0.75 }}>{gamepad.id}</div>
            <input value={string} readOnly aria-label="Введённый текст" />
            <button type="button" onClick={clear}>
              Очистить
            </button>
            <TimingControls options={timing} onChange={updateTiming} />
          </div>
        </div>
      ) : (
        <div style={{ padding: 24 }}>
          Подключите геймпад и нажмите любую кнопку
        </div>
      )}
    </>
  );
}

export default App;
