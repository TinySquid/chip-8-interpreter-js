import { hexy } from "hexy";

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

  /**
   *
   * @param {number} address
   * @param {Uint8Array} buffer
   */
  loadROM(address, buffer) {
    /* ibm.ch8
      00000000: 00e0 a22a 600c 6108 d01f 7009 a239 d01f 
      00000010: a248 7008 d01f 7004 a257 d01f 7008 a266 
      00000020: d01f 7008 a275 d01f 1228 ff00 ff00 3c00 
      00000030: 3c00 3c00 3c00 ff00 ffff 00ff 0038 003f 
      00000040: 003f 0038 00ff 00ff 8000 e000 e000 8000 
      00000050: 8000 e000 e000 80f8 00fc 003e 003f 003b 
      00000060: 0039 00f8 00f8 0300 0700 0f00 bf00 fb00 
      00000070: f300 e300 43e0 00e0 0080 0080 0080 0080 
      00000080: 00e0 00e0 000a  
    */
    console.log(hexy(Buffer.from(buffer), { annotate: "none", format: "fours" }));

    for (let i = 0; i < buffer.length; i++) {
      this.memory[address + i] = buffer[i];
    }
  }

  /**
   *
   * @param {number} address
   * @param {Array<number>} data
   */
  loadFont(address, data) {
    // Could probably unify with loadROM to just load any Uint8Array into memory
    for (let i = 0; i < data.length; i++) {
      this.memory[address + i] = data[i];
    }
  }
}
