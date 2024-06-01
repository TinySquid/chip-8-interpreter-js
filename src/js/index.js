import Chip8 from "./chip8";
import Keypad from "./keypad";
import Renderer from "./renderer";
import Speaker from "./speaker";

import fontData from "./font";
import { readROM } from "./utils";

/** @type {Chip8InterpreterOptions} */
const options = {
  cyclesPerSecond: 700,
  chunkIntervalMs: 100,
  programStartAddress: 0x200,
  memorySize: 4096,
};

const defaultFontLocation = 0x050;

const renderer = new Renderer(64, 32, 10, "renderer");
const keypad = new Keypad();
const speaker = new Speaker();

const chip8 = new Chip8(renderer, keypad, speaker, options);

chip8.loadFont(defaultFontLocation, fontData);

const btn = document.getElementById("b");
btn.addEventListener("click", async () => {
  const buffer = await readROM("ibm");
  chip8.loadROM(options["programStartAddress"], buffer);
})
