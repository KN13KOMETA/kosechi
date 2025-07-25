/**
 * @typedef {{
 * left: {
 *   up: string,
 *   middle: string,
 *   down: string
 * },
 * right: {
 *   up: string,
 *   middle: string,
 *   down: string
 * },
 * up: string,
 * down: string
 * } | string} FrameStyle
 */

import ssh2 from "ssh2"

const ESC = "\x1B[";

/** @type {FrameStyle} */
const defaultFrameStyle = {
  left: {
    up: "/",
    middle: "|",
    down: "\\"
  },
  right: {
    up: "\\",
    middle: "|",
    down: "/"
  },
  up: "-",
  down: "-"
}



const clearScreen = stdout => stdout.write(ESC + "2J");
const clearLineFromCursor = stdout => stdout.write(ESC + "0K");
const clearLine = stdout => stdout.write(ESC + "2K");
const hideCursor = stdout => stdout.write(ESC + "?25l");
const showCursor = stdout => stdout.write(ESC + "?25h");
const cursorTo = (stdout, x, y) => stdout.write(ESC + y + ";" + x + "H");


/** 
 * @param {NodeJS.WriteStream} stdout
 * @param {FrameStyle} frameStyle
 */
const drawFrame = (stdout, x, y, w, h, frameStyle = defaultFrameStyle) => {
  if (typeof frameStyle == "string") {
    cursorTo(stdout, x, y);
    stdout.write(frameStyle.repeat(w));
    cursorTo(stdout, x, y + h - 1);
    stdout.write(frameStyle.repeat(w));
    for (let ry = y + 1; ry + 1 < y + h; ry++) {
      cursorTo(stdout, x, ry);
      stdout.write(frameStyle);
      cursorTo(stdout, x + w - 1, ry);
      stdout.write(frameStyle);
    }
    return;
  }

  cursorTo(stdout, x, y);
  stdout.write(frameStyle.left.up + frameStyle.up.repeat(w - 2) + frameStyle.right.up);
  cursorTo(stdout, x, y + h - 1);
  stdout.write(frameStyle.left.down + frameStyle.down.repeat(w - 2) + frameStyle.right.down);
  for (let ry = y + 1; ry + 1 < y + h; ry++) {
    cursorTo(stdout, x, ry);
    stdout.write(frameStyle.left.middle);
    cursorTo(stdout, x + w - 1, ry);
    stdout.write(frameStyle.right.middle);
  }
}

export const ui = {
  clearScreen,
  clearLine,
  clearLineFromCursor,
  hideCursor,
  showCursor,
  cursorTo,
  drawFrame
}
// const user = { channel: process.stdout }
// const size = [process.stdout.columns, process.stdout.rows]
// ui.clearScreen(user.channel);
// ui.drawFrame(user.channel, 2, 3, size[0] - 20, size[1]);
// setInterval(() => { }, 1000);
