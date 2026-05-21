import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { useController } from './useController';
import { ButtonMap } from './utils/buttonMap';

function App() {
  const [string, setString] = useState('')

  const addChars = useCallback((chars: string[]) => {
    setString(prev => (prev + chars.join('')).trimStart())
  }, [])

  const clear = useCallback(() => setString(''), [])

  const { gamepad, currentState, tickResult } = useController({
    addChars
  });

  useEffect(() => {
    if (currentState?.pressedButtons & ButtonMap.BTN_2) {
      clear()
    }
  }, [currentState, clear])

  return (
    <>
      {gamepad !== null ? (
        <div className="col">
          <div>Connected: {gamepad.id}</div>
          <div className="col">
            <span>
              L: {currentState?.lSample.angle.toFixed(0)}° mag{' '}
              {currentState?.lSample.magnitude.toFixed(1)}{' '}
              {currentState?.lSample.active ? '●' : '○'}
            </span>
            <span>
              R: {currentState?.rSample.angle.toFixed(0)}° mag{' '}
              {currentState?.rSample.magnitude.toFixed(1)}{' '}
              {currentState?.rSample.active ? '●' : '○'}
            </span>
          </div>
          <div>
            Phase: L={tickResult?.state.left.phase} R={tickResult?.state.right.phase}
          </div>
          <div>Text: <input value={string} readOnly/></div>
          <button onClick={clear}>Clear</button>
        </div>
      ) : (
        <div>No gamepad found, press button or check connectivity</div>
      )}
    </>
  );
}

export default App;
