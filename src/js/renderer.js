import { PIXEL_ON_COLOR, PIXEL_OFF_COLOR } from "./utils";

export default class Renderer {
  constructor(width, height, scale = 10, displayElementId = "renderer") {
    /** @type {HTMLCanvasElement} */
    this.canvas = document.getElementById(displayElementId);

    /** @type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.getContext("2d");

    this.width = width;
    this.height = height;

    this.scale = scale;

    this.ctx.canvas.width = width * scale;
    this.ctx.canvas.height = height * scale;

    // Canvas draws from buffer at its own refresh rate.
    // Emulator modifies the buffer at its own set speed.
    this.buffer = new Array(width * height);

    this.isRunning = false;
    this.animFrameHandle = null;
  }

  pixelWidth() {
    return this.canvas.width / this.scale;
  }

  pixelHeight() {
    return this.canvas.height / this.scale;
  }

  togglePixel(x, y) {
    const mappedPixelIdx = x + y * this.width;

    // Pixels are XOR'd and VF should be set to 1 if a collision occurred.
    this.buffer[mappedPixelIdx] ^= 1;

    return !this.buffer[mappedPixelIdx];
  }

  draw() {
    if (this.isRunning) {
      this.animFrameHandle = requestAnimationFrame(this.draw.bind(this));
    }

    this.ctx.fillStyle = PIXEL_OFF_COLOR;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.ctx.fillStyle = PIXEL_ON_COLOR;

    for (let i = 0; i < this.buffer.length; i++) {
      // https://stackoverflow.com/a/56708654
      let x = (i % this.width) * this.scale;
      let y = Math.floor(i / this.width) * this.scale;

      if (this.buffer[i]) {
        this.ctx.fillRect(x, y, this.scale, this.scale);
      }
    }
  }

  clear() {
    this.buffer.fill(0);
    this.draw();
  }

  start() {
    this.isRunning = true;
    this.animFrameHandle = requestAnimationFrame(this.draw.bind(this));
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameHandle);
  }
}
