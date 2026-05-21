import { CONSONANTS, VOWELS } from '../mappings';
import type { ComposerState, GamepadEvent, StickSample, TickResult } from '../types';
import { ButtonMap } from './buttonMap';
import { StickProcessor } from './stickProcessor';

type LeftEvent =
  | { type: 'slot'; slot: number }
  | { type: 'neutral' };

type RightEvent = { type: 'slot'; slot: number };

export class SyllableComposer {
  private heldConsonant: string | null = null;
  private vowelFiredWhileHeld = false;

  onLeft(event: LeftEvent): string | null {
    if (event.type === 'slot') {
      this.heldConsonant = CONSONANTS[event.slot] ?? null;
      this.vowelFiredWhileHeld = false;
      return null;
    }

    if (event.type === 'neutral') {
      if (this.heldConsonant && !this.vowelFiredWhileHeld) {
        const text = this.heldConsonant;
        this.heldConsonant = null;
        return text;
      }
      this.heldConsonant = null;
      this.vowelFiredWhileHeld = false;
      return null;
    }

    return null;
  }

  onRight(event: RightEvent): string | null {
    const vowel = VOWELS[event.slot];
    if (!vowel) return null;

    this.vowelFiredWhileHeld = true;
    return (this.heldConsonant ?? '') + vowel;
  }

  getState(): ComposerState {
    return {
      heldConsonant: this.heldConsonant,
      vowelFiredWhileHeld: this.vowelFiredWhileHeld,
    };
  }

  reset(): void {
    this.heldConsonant = null;
    this.vowelFiredWhileHeld = false;
  }
}

export class GamepadProcessor {
  private leftProcessor = new StickProcessor();
  private rightProcessor = new StickProcessor();
  private composer = new SyllableComposer();
  private leftActive = false;
  private lastButtonsState = 0b0;

  tick(leftSample: StickSample, rightSample: StickSample, buttonsState: number): TickResult {
    const events: GamepadEvent[] = [];

    const pressed = (~this.lastButtonsState) & buttonsState; 
    // const released = this.lastButtonsState & (~buttonsState);
    this.lastButtonsState = buttonsState;

    if (pressed & ButtonMap.BTN_0) {
      events.push({ type: 'char', text: ' ' })
    }

    const leftEvent = this.leftProcessor.process(leftSample);
    let leftSlottedThisTick = false;

    if (leftEvent) {
      leftSlottedThisTick = true;
      events.push({
        type: 'slot_fired',
        stick: 'left',
        slot: leftEvent.slot,
        directionIndex: leftEvent.directionIndex,
        subSlot: leftEvent.subSlot,
      });
      const text = this.composer.onLeft({ type: 'slot', slot: leftEvent.slot });
      if (text) events.push({ type: 'char', text });
      this.leftActive = true;
    }

    // Не сабмитить в тот же тик, что и slot (release sub 0 иначе сразу печатает «Л», а не ждёт гласную)
    if (this.leftActive && !leftSample.active && !leftSlottedThisTick) {
      const text = this.composer.onLeft({ type: 'neutral' });
      if (text) events.push({ type: 'char', text });
      this.leftActive = false;
    }

    const rightEvent = this.rightProcessor.process(rightSample);

    if (rightEvent) {
      events.push({
        type: 'slot_fired',
        stick: 'right',
        slot: rightEvent.slot,
        directionIndex: rightEvent.directionIndex,
        subSlot: rightEvent.subSlot,
      });
      const text = this.composer.onRight({ type: 'slot', slot: rightEvent.slot });
      if (text) events.push({ type: 'char', text });
    }

    return {
      events,
      state: {
        left: this.leftProcessor.getState(),
        right: this.rightProcessor.getState(),
        composer: this.composer.getState(),
      },
    };
  }

  reset(): void {
    this.leftProcessor.reset();
    this.rightProcessor.reset();
    this.composer.reset();
    this.leftActive = false;
  }
}
