# CHIP-8 Interpreter in Javascript

A virtual machine with an interpreted programming language originally used on the COSMAC VIP and Telmac 1800 8-bit microcomputers in the 1970s. I noticed there are small details for the instruction set that change depending on where you look (like draw sprite wrapping vs clipping) but for the most part I will be following this reference from 1997: [Cowgod's CHIP-8 Technical Reference](./Cowgod's%20CHIP-8%20Technical%20Reference.pdf)

# Architecture

CHIP-8 has virtual registers, memory, IO (a keypad, speaker, and a small "screen") controlled by a simple instruction set. Data width for registers and memory are one byte wide, and instructions are two bytes wide.

The following components make up the CHIP-8 system:

- A Program Counter (PC) that points to the current instruction in memory.
- A special register, the index register (I), used to point at locations in memory.
- A stack for addresses, used for calling and returning from subroutines.
- 4kb of RAM (some of which is reserved for font glyphs)
- A sound timer that emits noise when its value is > 0. Decrements at 60hz.
- A delay timer that decrements at 60hz.
- 16 general-purpose registers labeled `V0` through `VF` in hexadecimal.
  - `VF` is also used as the flag register by some instructions to notify of overflow / underflow events during arithmetic operations.
- A 64x32 monochrome screen

## Important Considerations

The screen render loop will need to be decoupled from the interpreter loop because they are vastly different speeds. The emulator will be running at a variable amount of instructions per second depending on how I have it configured, but I will default it to 700hz, and the screen will be around 60fps or whatever `requestAnimationFrame` gives.

Using `setInterval` won't suffice for this as it doesn't have the timing resolution necessary, so I will be breaking execution into "chunks". Using 700 instructions per second as an example, I could run an interval over 100ms and each interval would handle the execution of 70 instructions.

Some implementations of the draw instruction (`DXYN`) wrap sprites across screen borders while others just clip it. I will probably make this configurable to support more ROMs. There are other instructions that have ambiguous implementations as well so as I come across them I will most likely set some way to configure it. As I test the emulator with more ROMs I can make more parts configurable, maybe even add SUPER-CHIP support at a later time (bigger screen, additional instructions).

The UI will need some thought as well. With audio controls, emulation speed, loading custom ROMs, modifying screen scale, etc. Also implementing some kind of window into the system to watch the memory, registers, and such in action would be a bonus.

## Keypad

Originally this was a 16 key hexidecimal keypad with the following layout:

|     |     |     |     |
| :-: | :-: | :-: | :-: |
|  1  |  2  |  3  |  C  |
|  4  |  5  |  6  |  D  |
|  7  |  8  |  9  |  E  |
|  A  |  0  |  B  |  F  |

I will be remapping it for modern keyboards:

|     |     |     |     |
| :-: | :-: | :-: | :-: |
|  1  |  2  |  3  |  4  |
|  Q  |  W  |  E  |  R  |
|  A  |  S  |  D  |  F  |
|  Z  |  X  |  C  |  V  |

## Interpreter loop

- Fetch -> read instruction from memory at address provided by PC
  - need to combine 2 bytes to make instruction
  - increment PC by 2
- Decode -> determine what should happen based on instruction (big switch block)
- Execute -> The case from the switch statement will execute the instruction behavior

## Instruction Set

| Instruction |                             Description                              |
| :---------: | :------------------------------------------------------------------: |
|   `00E0`    |                                Clear                                 |
|   `00EE`    |                                Return                                |
|   `1NNN`    |                            Jump to `NNN`                             |
|   `2NNN`    |                       Call subroutine at `NNN`                       |
|   `3XNN`    |                     if `VX` == `NN` then PC += 2                     |
|   `4XNN`    |                     if `VX` != `NN` then PC += 2                     |
|   `5XY0`    |                     if `VX` == `VY` then PC += 2                     |
|   `6XNN`    |                             `VX` = `NN`                              |
|   `7XNN`    |                             `VX` += `NN`                             |
|   `8XY0`    |                             `VX` = `VY`                              |
|   `8XY1`    |                            `VX` \|= `VY`                             |
|   `8XY2`    |                             `VX` &= `VY`                             |
|   `8XY3`    |                             `VX` ^= `VY`                             |
|   `8XY4`    |      `VX` += `VY` <br>`VF` = `1` on carry, `0` otherwise.</br>       |
|   `8XY5`    |      `VX` -= `VY` <br>`VF` = `0` on borrow, `0` otherwise.</br>      |
|   `8XY6`    |                            `VX` >>= `VX`                             |
|   `8XY7`    |                          `VX` = `VY` - `VX`                          |
|   `8XYE`    |                            `VX` <<= `VX`                             |
|   `9XY0`    |                     if `VX` != `VY` then PC += 2                     |
|   `ANNN`    |                             `I` = `NNN`                              |
|   `BNNN`    |                          jump to `NNN + V0`                          |
|   `CXNN`    |                     `VX` = random number &= `NN`                     |
|   `DXYN`    | sprite x coord `VX` y coord `VY` for `N` rows, `VF` = 1 on collision |
|   `EX9E`    |               if key code in `VX` pressed then PC += 2               |
|   `EXA1`    |             if key code in `VX` not pressed then PC += 2             |
|   `FX07`    |                       `VX` = delay timer value                       |
|   `FX0A`    |                  get key (blocking), store to `VX`                   |
|   `FX15`    |                          delay timer = `VX`                          |
|   `FX18`    |                          sound timer = `VX`                          |
|   `FX1E`    |                             `I` += `VX`                              |
|   `FX29`    |      `I` = memory address of font char stored in register `VX`       |
|   `FX33`    |                               bcd `VX`                               |
|   `FX55`    |           save `V0..VX` to memory starting at address `I`            |
|   `FX65`    |         load from memory starting at address `I` to `V0..VX`         |

## Credits

Many thanks to the chip8 ROMs provided by [Timendus's Chip-8 Test Suite](https://github.com/Timendus/chip8-test-suite) repo

[Laurence Scotford's](https://www.laurencescotford.net/2020/07/25/chip-8-on-the-cosmac-vip-index/) deep dive on the original behavior of the Chip-8 Interpreter
