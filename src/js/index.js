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
  defaultFontStartAddress: 0x050,
  memorySize: 4096,
};

const renderer = new Renderer(64, 32, 10, "renderer");
const keypad = new Keypad();
const speaker = new Speaker();

const chip8 = new Chip8(renderer, keypad, speaker, options);

chip8.loadFont(options.defaultFontStartAddress, fontData);

const startBtn = document.getElementById("start-btn");
startBtn.addEventListener("click", () => {
  if (!chip8.isRunning) {
    chip8.start();
  }
});

const stopBtn = document.getElementById("stop-btn");
stopBtn.addEventListener("click", () => {
  if (chip8.isRunning) {
    chip8.stop();
  }
});

const stepBtn = document.getElementById("step-btn");
stepBtn.addEventListener("click", () => {
  if (!chip8.isRunning) {
    chip8.step();
  }
});

const loadBtn = document.getElementById("load-btn");
loadBtn.addEventListener("click", async () => {
  chip8.reset();

  // const buffer = await readROM("/test/1-chip8-logo");
  // const buffer = await readROM("/test/3-corax+");
  const buffer = await readROM("/test/4-flags");

  chip8.loadROM(options.programStartAddress, buffer);
});
