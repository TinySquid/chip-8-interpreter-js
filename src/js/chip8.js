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

    this.options = options;

    this.memory = new Array(this.options["memorySize"]).fill(0);
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
      PC: this.options["programStartAddress"],
    };

    this.isRunning = false;
    this.isPausedByKeypad = false;

    this.chunk = {
      handler: null,
      intervalMs: this.options["chunkIntervalMs"],
      cyclesPerInterval:
        this.options["cyclesPerSecond"] /
        (1000 / this.options["chunkIntervalMs"]),
    };

    this.timer = {
      delay: 0,
      sound: 0,
      handler: null,
    };
  }

  start() {
    this.isRunning = true;

    this.renderer.start();

    this.chunk.handler = setInterval(
      this.runChunk.bind(this),
      this.chunk.intervalMs
    );

    // 58hz close enough...?
    this.timer.handler = setInterval(this.updateTimers.bind(this), 17);
  }

  stop() {
    this.isRunning = false;
    this.isPausedByKeypad = false;

    this.renderer.stop();

    clearInterval(this.chunk.handler);
    clearInterval(this.timer.handler);
  }

  reset() {
    this.stop();

    this.memory.fill(0);
    this.stack = [];

    for (let key of Object.keys(this.registers)) {
      this.registers[key] = 0;
    }

    this.registers["PC"] = this.options["programStartAddress"];

    this.renderer.stop();
    this.renderer.clear();
  }

  runChunk() {
    for (let i = 0; i < this.chunk.cyclesPerInterval; i++) {
      try {
        this.step();
      } catch (e) {
        console.error(e.message);

        this.stop();

        break;
      }
    }
  }

  updateTimers() {
    if (this.timer.delay > 0) {
      this.timer.delay--;
    }

    if (this.timer.sound > 0) {
      this.timer.sound--;
    }
  }

  step() {
    if (this.isPausedByKeypad) return;

    /*
      memory is 1 byte wide so the instruction needs to
      combine two single byte reads.
      ex a22a instruction:
      a2 ->       1010 0010 
      2a ->       0010 1010
      a2 Lsh 8 -> 1010 0010 0000 0000
      OR 2a ->    1010 0010 0010 1010
    */

    // FETCH
    const instruction =
      (this.memory[this.registers["PC"]] << 8) |
      this.memory[this.registers["PC"] + 1];

    this.registers["PC"] += 2;

    // DECODE
    /*
      ANNN
        - stores immediate 12-bit value into I register
        A - opcode 
        NNN - operand

      immediate can be 1, 2, or 3 nibbles
      instruction can have specifiers for operating on registers X / and or Y
      1st, 2nd, and last nibble can be opcodes

      just decode everything in one place and use where needed
    */
    const opcode = [
      (instruction & 0xf000) >> 12,
      instruction & 0x00ff,
      instruction & 0x000f,
    ];

    const vX = (instruction & 0x0f00) >> 8;
    const vY = (instruction & 0x00f0) >> 4;

    let iN = instruction & 0x000f;
    let iNN = instruction & 0x00ff;
    let iNNN = instruction & 0x0fff;

    // EXECUTE
    switch (opcode[0]) {
      case 0x0:
        switch (opcode[1]) {
          // 00E0
          case 0xe0:
            this.renderer.clear();
            break;

          // 00EE
          case 0xee:
            this.registers["PC"] = this.stack.pop();
            break;

          default:
            throw new Error(
              `invalid instruction: 0x${instruction.toString(16)}`
            );
        }
        break;

      // 1NNN
      case 0x1:
        this.registers["PC"] = iNNN;
        break;

      // 2NNN
      case 0x2:
        this.stack.push(this.registers["PC"]);

        this.registers["PC"] = iNNN;
        break;

      // 3XNN
      case 0x3:
        if (this.registers[vX] === iNN) this.registers["PC"] += 2;
        break;

      // 4XNN
      case 0x4:
        if (this.registers[vX] !== iNN) this.registers["PC"] += 2;
        break;

      // 5XY0
      case 0x5:
        if (this.registers[vX] === this.registers[vY])
          this.registers["PC"] += 2;
        break;

      // 6XNN
      case 0x6:
        this.registers[vX] = iNN;
        break;

      // 7XNN
      case 0x7:
        this.registers[vX] += iNN;
        this.registers[vX] &= 255;

        break;

      // 8--- instructions
      case 0x8:
        switch (opcode[2]) {
          // 8XY0
          case 0x0:
            this.registers[vX] = this.registers[vY];
            break;

          // 8XY1
          case 0x1:
            this.registers[vX] |= this.registers[vY];
            this.registers[0xf] = 0;
            break;

          // 8XY2
          case 0x2:
            this.registers[vX] &= this.registers[vY];
            this.registers[0xf] = 0;
            break;

          // 8XY3
          case 0x3:
            this.registers[vX] ^= this.registers[vY];
            this.registers[0xf] = 0;
            break;

          // 8XY4
          case 0x4:
            {
              this.registers[vX] += this.registers[vY];

              if (this.registers[vX] > 255) {
                this.registers[0xf] = 1;
              } else {
                this.registers[0xf] = 0;
              }

              this.registers[vX] &= 255;
            }
            break;

          // 8XY5
          case 0x5:
            {
              this.registers[vX] -= this.registers[vY];

              if (this.registers[vX] < 0) {
                this.registers[0xf] = 0;
              } else {
                this.registers[0xf] = 1;
              }

              this.registers[vX] &= 255;
            }
            break;

          // 8XY6
          case 0x6:
            const lsb = this.registers[vX] & 1;

            this.registers[vX] = this.registers[vY];
            this.registers[vX] >>= 1;

            if (lsb) {
              this.registers[0xf] = 1;
            } else {
              this.registers[0xf] = 0;
            }

            this.registers[vX] &= 255;

            break;

          // 8XY7
          case 0x7:
            this.registers[vX] = this.registers[vY] - this.registers[vX];

            if (this.registers[vX] < 0) {
              this.registers[0xf] = 0;
            } else {
              this.registers[0xf] = 1;
            }

            this.registers[vX] &= 255;

            break;

          // 8XYE
          case 0xe:
            const msb = this.registers[vX] & 0x80;
            
            this.registers[vX] = this.registers[vY];
            this.registers[vX] <<= 1;

            if (msb) {
              this.registers[0xf] = 1;
            } else {
              this.registers[0xf] = 0;
            }

            this.registers[vX] &= 255;

            break;
        }
        break;

      // 9XY0
      case 0x9:
        if (this.registers[vX] !== this.registers[vY])
          this.registers["PC"] += 2;
        break;

      // ANNN
      case 0xa:
        this.registers["I"] = iNNN;
        break;

      // BNNN
      case 0xb:
        this.registers["PC"] = iNNN + this.registers[0x0];
        break;

      // CXNN
      case 0xc:
        const r = Math.floor(Math.random() * 0xff);

        this.registers[vX] = r & iNN;
        break;

      // DXYN (drawing)
      case 0xd:
        const spriteMemoryAddress = this.registers["I"];

        // registers are 1 byte wide so 255 should map to display size
        // ie 16 is the same as 240 % 32 (height) = 16
        let xStart = this.registers[vX] % this.renderer.pixelWidth();
        let yStart = this.registers[vY] % this.renderer.pixelHeight();

        let x = xStart;
        let y = yStart;

        let pixelDidFlip = false;

        // this.registers[0xf] = 0;

        // sprite behavior will clip when past screen boundary vs wrapping
        for (let row = 0; row < iN; row++) {
          const spriteRowAddr = spriteMemoryAddress + row;
          const spriteRowData = this.memory[spriteRowAddr];

          if (y > this.renderer.pixelHeight()) break;

          for (let col = 7; col >= 0; col--) {
            if (x > this.renderer.pixelWidth()) break;

            const bitMask = 2 ** col;

            const pixel = bitMask & spriteRowData;

            if (pixel) {
              const collision = this.renderer.togglePixel(x, y);

              if (collision) pixelDidFlip = true;
            }

            x++;
          }

          x = xStart;
          y++;
        }

        // if (pixelDidFlip) this.registers[0xf] = 1;

        break;

      case 0xe:
        switch (opcode[1]) {
          // EX9E
          case 0x9e:
            if (this.keypad.isKeyPressed(this.registers[vX])) {
              this.registers["PC"] += 2;
            }

            break;

          // EXA1
          case 0xa1:
            if (!this.keypad.isKeyPressed(this.registers[vX])) {
              this.registers["PC"] += 2;
            }

            break;
        }
        break;

      // F--- instructions
      case 0xf:
        switch (opcode[1]) {
          // FX07
          case 0x07:
            this.registers[vX] = this.timer.delay;
            break;

          // FX0A
          case 0x0a:
            this.isPausedByKeypad = true;

            this.keypad.blockingKeyPressHandler = (key) => {
              this.registers[vX] = key;
              this.isPausedByKeypad = false;
            };

            break;

          // FX15
          case 0x15:
            this.timer.delay = this.registers[vX];
            break;

          // FX18
          case 0x18:
            this.timer.sound = this.registers[vX];
            break;

          // FX1E
          case 0x1e:
            this.registers["I"] += this.registers[vX];

            if (this.registers["I"] > 0x0fff) {
              // this.registers[0xf] = 1;
            }

            this.registers["I"] &= 0x0fff;
            break;

          // FX29
          case 0x29:
            this.registers["I"] =
              this.options.defaultFontStartAddress + this.registers[vX] * 5;
            break;

          // FX33
          // BCD
          case 0x33:
            this.memory[this.registers["I"]] = Math.floor(
              this.registers[vX] / 100
            );

            this.memory[this.registers["I"] + 1] = Math.floor(
              (this.registers[vX] % 100) / 10
            );

            this.memory[this.registers["I"] + 2] = this.registers[vX] % 10;

            break;

          // FX55
          case 0x55:
            for (let r = 0; r <= vX; r++) {
              this.memory[this.registers["I"]] = this.registers[r];
              this.registers["I"]++;
            }
            break;

          // FX65
          case 0x65:
            for (let r = 0; r <= vX; r++) {
              this.registers[r] = this.memory[this.registers["I"] + r];
            }
            break;
        }
        break;

      default:
        throw new Error(`invalid instruction: 0x${instruction.toString(16)}`);
    }

    // manually draw in step-thru mode
    if (!this.isRunning) {
      this.renderer.draw();
      this.printRegisters();
    }
  }

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
    console.log(
      hexy(Buffer.from(buffer), { annotate: "none", format: "fours" })
    );

    for (let i = 0; i < buffer.length; i++) {
      this.memory[address + i] = buffer[i];
    }

    this.registers["PC"] = this.options["programStartAddress"];
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

  printRegisters() {
    let prettyString = `PC: ${this.registers["PC"]} (0x${this.registers[
      "PC"
    ].toString(16)}) | I: ${this.registers["I"]} (0x${this.registers[
      "I"
    ].toString(16)})\n`;

    for (let [key, value] of Object.entries(this.registers)) {
      if (key == 4 || key == 8 || key == 12) {
        prettyString += "\n";
      }

      if (key !== "PC" && key !== "I") {
        prettyString += `V${key}: ${value} (0x${value.toString(16)}) | `;
      }
    }

    prettyString = prettyString.slice(0, -2);
    console.log(prettyString);
  }
}
