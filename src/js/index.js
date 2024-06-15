import Chip8 from "./chip8";
import Keypad from "./keypad";
import Renderer from "./renderer";
import Speaker from "./speaker";

import fontData from "./font";
import { readROM } from "./utils";

/** @type {Chip8InterpreterOptions} */
const options = {
  cyclesPerSecond: 2000,
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

chip8.renderer.togglePixel(10, 10);

const startBtn = document.getElementById("start-btn");
startBtn.addEventListener("click", () => {
  if (!chip8.isRunning) {
    chip8.start();

    startBtn.setAttribute("disabled", true);
    stepBtn.setAttribute("disabled", true);

    stopBtn.removeAttribute("disabled");
  }
});

const stopBtn = document.getElementById("stop-btn");
stopBtn.setAttribute("disabled", true);

stopBtn.addEventListener("click", () => {
  if (chip8.isRunning) {
    chip8.stop();

    startBtn.removeAttribute("disabled");
    stepBtn.removeAttribute("disabled");

    stopBtn.setAttribute("disabled", true);
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

  const buffer = await readROM("/games/ibm");

  chip8.loadROM(options.programStartAddress, buffer);

  // audio in browser can only be started after a user event
  speaker.init();
});
