import Renderer from "./renderer";
import Keypad from "./keypad";
import Speaker from "./speaker";

export default class Chip8 {
  /**
   *
   * @param {Renderer} renderer
   * @param {Keypad} keypad
   * @param {Speaker} speaker
   * @param {Chip8InterpreterOptions} options
   */
  constructor(renderer, keypad, speaker, options) {
    this.renderer = renderer;
    this.keypad = keypad;
    this.speaker = speaker;

    this.memory = new Array(options["memorySize"]).fill(0);
    this.stack = [];

    this.registers = {
      0x0: 0,
      0x1: 0,
      0x2: 0,
      0x3: 0,
      0x4: 0,
      0x5: 0,
      0x6: 0,
      0x7: 0,
      0x8: 0,
      0x9: 0,
      0xa: 0,
      0xb: 0,
      0xc: 0,
      0xd: 0,
      0xe: 0,
      0xf: 0,
      I: 0,
      PC: 0,
    };

    this.isRunning = false;
  }

  start() {}

  stop() {}

  reset() {}

  step() {}

  loadROM(address, buffer) {}

  loadFont(address, data) {}
}
