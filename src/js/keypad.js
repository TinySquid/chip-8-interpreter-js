export default class Keypad {
  constructor() {
    this.keybinds = {
      Digit1: 0x1,
      Digit2: 0x2,
      Digit3: 0x3,
      Digit4: 0xc,
      KeyQ: 0x4,
      KeyW: 0x5,
      KeyE: 0x6,
      KeyR: 0xd,
      KeyA: 0x7,
      KeyS: 0x8,
      KeyD: 0x9,
      KeyF: 0xe,
      KeyZ: 0xa,
      KeyX: 0x0,
      KeyC: 0xb,
      KeyV: 0xf,
    };

    this.keyStates = {};

    // for handling FX0A instruction
    this.blockingKeyPressHandler = null;

    Object.values(this.keybinds).forEach((v) => {
      this.keyStates[v] = false;
    });

    window.addEventListener("keydown", this.onKeyDown.bind(this), false);
    window.addEventListener("keyup", this.onKeyUp.bind(this), false);
  }

  isKeyPressed(code) {
    return !!this.keyStates[code];
  }

  /**
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    const key = this.keybinds[event.code];

    if (key !== undefined) {
      this.keyStates[key] = true;
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    const key = this.keybinds[event.code];

    if (key !== undefined) {
      this.keyStates[key] = false;

      if (this.blockingKeyPressHandler !== null) {
        this.blockingKeyPressHandler(key);
        this.blockingKeyPressHandler = null;
      }
    }
  }
}
