import type { ReactNode } from 'react';
import type { StickProcessorState, StickSample } from './types';
import { CARDINAL_ANGLES, getCardinalIndex, getSubSlot } from './utils/newAngles';
import {
  CARDINAL_RELEASE_SLOTS,
  polarToXY,
  subSlotGestureAngle,
} from './utils/stickLayout';

const SIZE = 240;
const R = SIZE / 2;
const LETTER_R = R - 24;
const RELEASE_R = LETTER_R - 30;
const GESTURE_R = LETTER_R;
const DOT_MAX_R = R - 56;
/** Радиус мини-кластера превью вокруг кардинальной буквы */
const PREVIEW_CLUSTER_R = 22;

interface StickPadProps {
  title: string;
  sample: StickSample;
  state: StickProcessorState;
  mapping: Record<number, string | null>;
}

export function StickPad({ title, sample, state, mapping }: StickPadProps) {
  const locked = state.lockedDirectionIndex;
  const lockedAngle = state.lockedDirectionAngle;
  const showSubSlots =
    locked !== null &&
    lockedAngle !== null &&
    (state.phase === 'direction_locked' || state.phase === 'committed');

  const hoverCardinal =
    state.phase === 'idle' && sample.active
      ? getCardinalIndex(sample.angle)
      : null;

  const hoverSubPreview =
    hoverCardinal !== null
      ? getSubSlot(sample.angle, CARDINAL_ANGLES[hoverCardinal])
      : null;

  const hoverSub =
    showSubSlots && sample.active && lockedAngle !== null
      ? getSubSlot(sample.angle, lockedAngle)
      : null;

  const dot =
    sample.active
      ? polarToXY(sample.angle, sample.magnitude * DOT_MAX_R)
      : null;

  const letters: ReactNode[] = showSubSlots
    ? renderLockedGroup(locked!, lockedAngle!, mapping, hoverSub, state.phase)
    : renderIdleGroups(mapping, hoverCardinal, hoverSubPreview);

  return (
    <div className="stick-pad">
      <div className="stick-pad__title">{title}</div>
      <div
        className={[
          'stick-pad__circle',
          state.phase !== 'idle' ? 'stick-pad__circle--locked' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: SIZE, height: SIZE }}
      >
        <div className="stick-pad__ring" />
        {showSubSlots && lockedAngle !== null && (
          <div
            className="stick-pad__lock-wedge"
            style={{ transform: `rotate(${lockedAngle}deg)` }}
          />
        )}
        {letters}
        {dot && (
          <div
            className="stick-pad__dot"
            style={{ left: R + dot.x, top: R + dot.y }}
          />
        )}
        <div className="stick-pad__center" />
      </div>
      <div className="stick-pad__phase">{phaseLabel(state.phase)} {(state.magnitude * 100).toFixed(0)}%</div>
    </div>
  );
}

function subRadius(sub: number): number {
  return sub === 0 ? RELEASE_R : GESTURE_R;
}

function renderLetter(
  key: number,
  char: string,
  x: number,
  y: number,
  classNames: string[],
): ReactNode {
  return (
    <span
      key={key}
      className={['stick-pad__letter', ...classNames].filter(Boolean).join(' ')}
      style={{ left: R + x, top: R + y }}
    >
      {char}
    </span>
  );
}

function renderLockedGroup(
  locked: number,
  lockedAngle: number,
  mapping: Record<number, string | null>,
  hoverSub: number | null,
  phase: StickProcessorState['phase'],
): ReactNode[] {
  return Array.from({ length: 5 }, (_, sub) => {
    const slot = locked * 5 + sub;
    const char = mapping[slot];
    if (!char) return null;
    const { x, y } = polarToXY(subSlotGestureAngle(lockedAngle, sub), subRadius(sub));
    const active =
      phase === 'committed' && hoverSub === sub ? false : hoverSub === sub;
    return renderLetter(slot, char, x, y, [
      sub === 0 ? 'stick-pad__letter--release' : 'stick-pad__letter--gesture',
      active ? 'stick-pad__letter--active' : '',
    ]);
  }).filter(Boolean);
}

function renderIdleGroups(
  mapping: Record<number, string | null>,
  hoverCardinal: number | null,
  hoverSubPreview: number | null,
): ReactNode[] {
  const nodes: ReactNode[] = [];

  CARDINAL_RELEASE_SLOTS.forEach((releaseSlot, dirIndex) => {
    const baseAngle = CARDINAL_ANGLES[dirIndex];
    const baseSlot = dirIndex * 5;
    const groupActive = hoverCardinal === dirIndex;
    const { x: mx, y: my } = polarToXY(baseAngle, LETTER_R);

    const release = mapping[releaseSlot];
    if (release) {
      nodes.push(
        renderLetter(releaseSlot, release, mx, my, [
          'stick-pad__letter--cardinal',
          groupActive ? 'stick-pad__letter--active' : '',
        ]),
      );
    }

    for (let sub = 1; sub <= 4; sub++) {
      const slot = baseSlot + sub;
      const char = mapping[slot];
      if (!char) continue;

      const { x: ox, y: oy } = polarToXY(
        subSlotGestureAngle(baseAngle, sub),
        PREVIEW_CLUSTER_R,
      );
      const subActive = groupActive && hoverSubPreview === sub;

      nodes.push(
        renderLetter(slot, char, mx + ox, my + oy, [
          'stick-pad__letter--preview',
          groupActive ? 'stick-pad__letter--preview-visible' : '',
          subActive ? 'stick-pad__letter--active' : '',
        ]),
      );
    }
  });

  return nodes;
}

function phaseLabel(phase: StickProcessorState['phase']): string {
  switch (phase) {
    case 'idle':
      return 'направление';
    case 'direction_locked':
      return 'жест';
    case 'committed':
      return 'выбрано';
  }
}
