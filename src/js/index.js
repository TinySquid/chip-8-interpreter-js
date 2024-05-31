import Renderer from "./renderer";

const screen = new Renderer(64, 32, 10, "renderer");

screen.start();

setInterval(() => {
  screen.togglePixel(0, 0);
  screen.togglePixel(0, 31);
  screen.togglePixel(63, 0);
  screen.togglePixel(63, 31);
}, 500);

setTimeout(() => {
  screen.stop();
}, 3000);
