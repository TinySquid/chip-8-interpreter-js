// Will need to make these configurable in the UI later
export const PIXEL_ON_COLOR = "#d3eca1";
export const PIXEL_OFF_COLOR = "#3e452f";

/**
 * Read a .ch8 ROM into a TypedArray
 * @param {string} filename
 * @returns {Uint8Array}
 */
export async function readROM(filename) {
  const res = await fetch(`roms/${filename}.ch8`, { mode: "same-origin" });
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();

  return new Uint8Array(buffer);
}
