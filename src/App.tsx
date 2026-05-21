import { useState } from 'react';
import './App.css';
import { useController } from './useController';

function App() {
  const { gamepad, currentState } = useController();

  return (
    <>
      {gamepad !== null ? (
        <div className="col">
          <div>Connected: {gamepad.id}</div>
          <div className="col">
            <span>L: {currentState?.lAngle.angle.toFixed(2)};</span>
            <span>R: {currentState?.rAngle.angle.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div>No gamepad found, press button or check connectivity</div>
      )}
    </>
  );
}

export default App;
