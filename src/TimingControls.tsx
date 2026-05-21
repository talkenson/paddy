import type { StickTimingOptions } from './stickOptions';
import { DEFAULT_STICK_OPTIONS } from './stickOptions';

interface TimingControlsProps {
  options: StickTimingOptions;
  onChange: (options: StickTimingOptions) => void;
}

export function TimingControls({ options, onChange }: TimingControlsProps) {
  return (
    <div className="timing-panel">
      <div className="timing-panel__title">Тайминги</div>
      <label className="timing-panel__row">
        <span className="timing-panel__label">
          Назад (удержание)
          <span className="timing-panel__value">{options.backHoldMs} мс</span>
        </span>
        <input
          type="range"
          min={80}
          max={1200}
          step={20}
          value={options.backHoldMs}
          onChange={(e) =>
            onChange({ ...options, backHoldMs: Number(e.target.value) })
          }
        />
      </label>
      <label className="timing-panel__row">
        <span className="timing-panel__label">
          Блокировка направления
          <span className="timing-panel__value">{options.disableDirectionMs} мс</span>
        </span>
        <input
          type="range"
          min={0}
          max={2000}
          step={50}
          value={options.disableDirectionMs}
          onChange={(e) =>
            onChange({ ...options, disableDirectionMs: Number(e.target.value) })
          }
        />
      </label>
      <button
        type="button"
        className="timing-panel__reset"
        onClick={() => onChange({ ...DEFAULT_STICK_OPTIONS })}
      >
        Сбросить
      </button>
    </div>
  );
}
