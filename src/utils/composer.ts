import { CONSONANTS, VOWELS } from '../mappings';
import type { ComposerState, GamepadEvent, StickSample, TickResult } from '../types';
import { ButtonMap } from './buttonMap';
import { StickProcessor } from './stickProcessor';

type LeftEvent =
  | { type: 'slot'; slot: number }
  | { type: 'neutral' };

type RightEvent =
  | { type: 'slot'; slot: number }
  | { type: 'neutral' };

export class SyllableComposer {
  private heldConsonant: string | null = null;
  private selectedVowel: string | null = null;
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
    if (event.type === 'slot') {
      const vowel = VOWELS[event.slot];
      if (!vowel) return null;
      this.selectedVowel = vowel;
      return null;
    }

    if (!this.selectedVowel) return null;
    const text = (this.heldConsonant ?? '') + this.selectedVowel;
    this.selectedVowel = null;
    this.vowelFiredWhileHeld = true;
    return text;
  }

  getState(): ComposerState {
    return {
      heldConsonant: this.heldConsonant,
      vowelFiredWhileHeld: this.vowelFiredWhileHeld,
    };
  }

  /**
   * BTN_7 — сабмит без отпускания стика.
   * Есть гласная → слог (РИ); иначе только согласная (П).
   */
  submitFromButton(): string | null {
    if (this.selectedVowel) {
      const text = (this.heldConsonant ?? '') + this.selectedVowel;
      this.selectedVowel = null;
      this.heldConsonant = null;
      this.vowelFiredWhileHeld = true;
      return text;
    }
    if (this.heldConsonant && !this.vowelFiredWhileHeld) {
      const text = this.heldConsonant;
      this.heldConsonant = null;
      this.vowelFiredWhileHeld = false;
      return text;
    }
    return null;
  }

  onStickBack(stick: 'left' | 'right'): void {
    if (stick === 'left') {
      this.heldConsonant = null;
      this.vowelFiredWhileHeld = false;
    } else {
      this.selectedVowel = null;
    }
  }

  reset(): void {
    this.heldConsonant = null;
    this.selectedVowel = null;
    this.vowelFiredWhileHeld = false;
  }
}

export class GamepadProcessor {
  private leftProcessor = new StickProcessor();
  private rightProcessor = new StickProcessor();
  private composer = new SyllableComposer();
  private leftActive = false;
  private rightActive = false;
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

    if (this.leftProcessor.consumeBack()) {
      this.leftActive = false;
      this.composer.onStickBack('left');
    }

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
    let rightSlottedThisTick = false;
    const btn7Held = !!(buttonsState & ButtonMap.BTN_7);

    if (this.rightProcessor.consumeBack()) {
      this.rightActive = false;
      this.composer.onStickBack('right');
    }

    if (rightEvent) {
      rightSlottedThisTick = true;
      events.push({
        type: 'slot_fired',
        stick: 'right',
        slot: rightEvent.slot,
        directionIndex: rightEvent.directionIndex,
        subSlot: rightEvent.subSlot,
      });
      this.composer.onRight({ type: 'slot', slot: rightEvent.slot });
      this.rightActive = true;
    }

    const tryBtn7Submit = () => {
      const text = this.composer.submitFromButton();
      if (text) events.push({ type: 'char', text });
    };

    // Нажатие: П, или РИ если гласная уже выбрана
    if ((pressed & ButtonMap.BTN_7) && !leftSlottedThisTick && !rightSlottedThisTick) {
      tryBtn7Submit();
    }
    // Удержание + новая гласная → допечатать (РИ, потом ещё А, Е…)
    if (btn7Held && rightSlottedThisTick) {
      tryBtn7Submit();
    }

    // Правый: коммит при отпускании, если BTN_7 не удерживают
    if (this.rightActive && !rightSample.active) {
      if (!btn7Held) {
        const text = this.composer.onRight({ type: 'neutral' });
        if (text) events.push({ type: 'char', text });
      }
      this.rightActive = false;
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
    this.rightActive = false;
  }
}
