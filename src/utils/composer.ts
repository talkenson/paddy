// ---- types ----

interface SlotEvent {
    slot: number;
    directionIndex: number;
    subSlot: number;
  }
  
  type LeftEvent =
    | { type: 'slot'; slot: number }
    | { type: 'neutral' };               // вернулся в нейтраль
  
  type RightEvent =
    | { type: 'slot'; slot: number };
  
  interface SyllableOutput {
    text: string;                         // "ПА", "Р", "О" и т.д.
  }
  
  // ---- mapping (пример, расставишь сам) ----
  
  const CONSONANTS: Record<number, string> = {
    0:  'П',  1: 'Б',  2: 'В',  3: 'Ф',  4: 'М',   // UP
    5:  'Т',  6: 'Д',  7: 'С',  8: 'З',  9: 'Н',   // RIGHT
    10: 'К', 11: 'Г', 12: 'Х', 13: 'Ш', 14: 'Ж',   // DOWN
    15: 'Р', 16: 'Л', 17: 'Ч', 18: 'Щ', 19: 'Ц',   // LEFT
  };
  
  const VOWELS: Record<number, string> = {
    0:  'А',  1: 'Я',  2: 'Э',  3: 'Е',  4: 'Ы',   // UP
    5:  'И',  6: 'Й',  7: 'О',  8: 'Ё',  9: 'У',   // RIGHT
    10: 'Ю', 11: 'Ь',                                // DOWN (остальные слоты — символы/пунктуация)
  };
  
  // ---- composer ----
  
  export class SyllableComposer {
    private heldConsonant: string | null = null;
    private vowelFiredWhileHeld = false;
  
    onLeft(event: LeftEvent): SyllableOutput | null {
      if (event.type === 'slot') {
        // Фиксируем новую согласную, сбрасываем флаг
        this.heldConsonant = CONSONANTS[event.slot] ?? null;
        this.vowelFiredWhileHeld = false;
        return null;
      }
  
      if (event.type === 'neutral') {
        // Левый вернулся в нейтраль
        if (this.heldConsonant && !this.vowelFiredWhileHeld) {
          // Голая согласная — гласная так и не пришла
          const text = this.heldConsonant;
          this.heldConsonant = null;
          return { text };
        }
        this.heldConsonant = null;
        this.vowelFiredWhileHeld = false;
        return null;
      }
  
      return null;
    }
  
    onRight(event: RightEvent): SyllableOutput | null {
      const vowel = VOWELS[event.slot];
      if (!vowel) return null;
  
      this.vowelFiredWhileHeld = true;
      const text = (this.heldConsonant ?? '') + vowel;
      // Согласная остаётся — можно сразу бить следующую гласную
      return { text };
    }
  }
  
  // ---- координатор двух стиков ----
  
  export class GamepadInputSystem {
    private leftProcessor  = new StickInputProcessor();
    private rightProcessor = new StickInputProcessor();
    private composer       = new SyllableComposer();
  
    private leftActive = false; // отслеживаем переход в нейтраль
  
    tick(
      leftSample: StickSample,
      rightSample: StickSample,
    ): SyllableOutput[] {
      const out: SyllableOutput[] = [];
  
      // --- левый стик ---
      const leftEvent = this.leftProcessor.process(leftSample);
  
      if (leftEvent) {
        const result = this.composer.onLeft({ type: 'slot', slot: leftEvent.slot });
        if (result) out.push(result);
        this.leftActive = true;
      }
  
      // Детектим возврат левого в нейтраль
      if (this.leftActive && !leftSample.active) {
        const result = this.composer.onLeft({ type: 'neutral' });
        if (result) out.push(result);
        this.leftActive = false;
      }
  
      // --- правый стик ---
      const rightEvent = this.rightProcessor.process(rightSample);
  
      if (rightEvent) {
        const result = this.composer.onRight({ type: 'slot', slot: rightEvent.slot });
        if (result) out.push(result);
      }
  
      return out;
    }
  
    reset(): void {
      this.leftProcessor.reset();
      this.rightProcessor.reset();
      this.composer = new SyllableComposer();
      this.leftActive = false;
    }
  }