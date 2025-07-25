/** Sequence */
const seq = {
  /** Escape */
  esc: "\x1b",
  /** Control Sequence Introducer */
  csi: "\x1b[",
  /** Device Control String */
  dcs: "\x90",
  /** Operating System Command */
  osc: "\x9d",
}

/** General */
const gen = {
  /** Terminal bell */
  bel: "\x07",
  /** Backspace */
  bs: "\x08",
  /** Horizontal TAB */
  ht: "\x09",
  /** Linefeed (newline) */
  lf: "\x0a",
  /** Vertical TAB */
  vt: "\x0b",
  /** Formfeed (also: New page NP) */
  ff: "\x0c",
  /** Carriage return */
  cr: "\x0d",
  /** Delete character */
  del: "\x7f",
}

/** Cursor */
const crs = {
  /** Moves cursor to home position (0, 0) */
  home: seq.csi + "H",
  /** Moves cursor to line #, column #
   * @param {number} line
   * @param {number} column */
  moveTo: (x, y) => seq.csi + `${y + 1};${x + 1}H`,
  /** Moves cursor up # lines
   * @param {number} count */
  moveUp: count => seq.csi + `${count}A`,
  /** Moves cursor down # lines */
  moveDown: count => seq.csi + `${count}B`,
  /** Moves cursor right # columns */
  moveRight: count => seq.csi + `${count}C`,
  /** Moves cursor left # columns */
  moveLeft: count => seq.csi + `${count}D`,
  /** Moves cursor to beginning of next line, # lines down */
  moveNextLine: count => seq.csi + `${count}E`,
  /** Moves cursor to beginning of previous line, # lines up */
  movePrevLine: count => seq.csi + `${count}F`,
  /** Moves cursor to column # */
  moveX: x => seq.csi + `${x + 1}G`,
  /** Request cursor position (reports as ESC[#;#R), you should catch output by yourself */
  getPos: seq.csi + "6n",
  /** Moves cursor one line up, scrolling if needed, May not work */
  scrollUp: seq.esc + " M",
  /** Save cursor position (DEC), May not work */
  savePos: seq.esc + " 7",
  /** Restores the cursor to the last saved position (DEC), May not work */
  loadPos: seq.esc + " 8",
  /** Save cursor position (SCO) */
  savePosSco: seq.csi + "s",
  /** Restores the cursor to the last saved position (SCO) */
  loadPosSco: seq.csi + "u",
}

/** Erase */
const ers = {
  /** Erase in display (same as ESC[0J) */
  cursorScreenDown: seq.csi + "J",
  /** Erase from cursor until end of screen */
  cursorScreenDown0: seq.csi + "0J",
  /** Erase from cursor to beginning of screen */
  cursorScreenUp: seq.csi + "1J",
  /** Erase entire screen */
  screen: seq.csi + "2J",
  /** Erase saved lines */
  savedLines: seq.csi + "3J",
  /** Erase in line (same as ESC[0K) */
  cursorLineEnd: seq.csi + "K",
  /** Erase from cursor to end of line */
  cursorLineEnd0: seq.csi + "0K",
  /** Erase start of line to the cursor */
  cursorLineStart: seq.csi + "1K",
  /** Erase the entire line */
  line: seq.csi + "2K",
}

/** Color Mode */
const col_md = {
  reset: seq.csi + "0m",
  /** Bold mode. */
  bold: {
    set: seq.csi + "1m",
    res: seq.csi + "22m",
  },
  /** Dim/faint mode. */
  dim: {
    set: seq.csi + "2m",
    res: seq.csi + "22m",
  },
  /** Italic mode. */
  italic: {
    set: seq.csi + "3m",
    res: seq.csi + "23m",
  },
  /** Underline mode. */
  underline: {
    set: seq.csi + "4m",
    res: seq.csi + "24m",
  },
  /** Blinking mode */
  blinking: {
    set: seq.csi + "5m",
    res: seq.csi + "25m",
  },
  /** Inverse/reverse mode */
  inverse: {
    set: seq.csi + "7m",
    res: seq.csi + "27m",
  },
  /** Hidden/invisible mode */
  hidden: {
    set: seq.csi + "8m",
    res: seq.csi + "28m",
  },
  /** Strikethrough mode. */
  strikethrough: {
    set: seq.csi + "9m",
    res: seq.csi + "29m",
  },
}

/** Color 8-16 */
const col_x16 = {
  /** Black */
  black: {
    fg: seq.csi + "30m",
    bg: seq.csi + "40m",
  },
  /** Red */
  red: {
    fg: seq.csi + "31m",
    bg: seq.csi + "41m",
  },
  /** Green */
  green: {
    fg: seq.csi + "32m",
    bg: seq.csi + "42m",
  },
  /** Yellow */
  yellow: {
    fg: seq.csi + "33m",
    bg: seq.csi + "43m",
  },
  /** Blue */
  blue: {
    fg: seq.csi + "34m",
    bg: seq.csi + "44m",
  },
  /** Magenta */
  magenta: {
    fg: seq.csi + "35m",
    bg: seq.csi + "45m",
  },
  /** Cyan */
  cyan: {
    fg: seq.csi + "36m",
    bg: seq.csi + "46m",
  },
  /** White */
  white: {
    fg: seq.csi + "37m",
    bg: seq.csi + "47m",
  },
  /** Default */
  default: {
    fg: seq.csi + "39m",
    bg: seq.csi + "49m",
  },
  /** Bright Black */
  brightBlack: {
    fg: seq.csi + "90m",
    bg: seq.csi + "100m",
  },
  /** Bright Red */
  brightRed: {
    fg: seq.csi + "91m",
    bg: seq.csi + "101m",
  },
  /** Bright Green */
  brightGreen: {
    fg: seq.csi + "92m",
    bg: seq.csi + "102m",
  },
  /** Bright Yellow */
  brightYellow: {
    fg: seq.csi + "93m",
    bg: seq.csi + "103m",
  },
  /** Bright Blue */
  brightBlue: {
    fg: seq.csi + "94m",
    bg: seq.csi + "104m",
  },
  /** Bright Magenta */
  brightMagenta: {
    fg: seq.csi + "95m",
    bg: seq.csi + "105m",
  },
  /** Bright Cyan */
  brightCyan: {
    fg: seq.csi + "96m",
    bg: seq.csi + "106m",
  },
  /** Bright White */
  brightWhite: {
    fg: seq.csi + "97m",
    bg: seq.csi + "107m",
  },
}

/** Color 256 (8 bit) */
const col_x256 = {
  /** Set foreground color. 
   * @param {number} id */
  fg: id => seq.csi + `38;5;${id}m`,
  /** Set background color.
   * @param {number} id */
  bg: id => seq.csi + `48;5;${id}m`,
}

/** Color RGB (Truecolor, 24 bit) */
const col_rgb = {
  /** Set foreground color as RGB.
   * @param {number} r - Red
   * @param {number} g - Green
   * @param {number} b - Blue */
  fg: (r, g, b) => seq.csi + `38;2;${r};${g};${b}m`,
  /** Set background color as RGB.
   * @param {number} r - Red
   * @param {number} g - Green
   * @param {number} b - Blue */
  bg: (r, g, b) => seq.csi + `48;2;${r};${g};${b}m`,
}

/** Color */
const col = { md: col_md, x16: col_x16, x256: col_x256, rgb: col_rgb }

/** Screen Mode */
const scr_md = {
  /** Changes the screen width or type to the mode specified by value.
   * @param {number} w */
  setWidth: w => seq.csi + `=${w}h`,
  /** 40 x 25 monochrome (text), Id 0 */
  mch40x25: seq.csi + "=0h",
  /** 40 x 25 color (text), Id 1 */
  col40x25: seq.csi + "=1h",
  /** 80 x 25 monochrome (text), Id 2 */
  mch80x25: seq.csi + "=2h",
  /** 80 x 25 color (text), Id 3 */
  col80x25: seq.csi + "=3h",
  /** 320 x 200 4-color (graphics), Id 4 */
  col4_320x200: seq.csi + "=4h",
  /** 320 x 200 monochrome (graphics), Id 5 */
  mch320x200: seq.csi + "=5h",
  /** 640 x 200 monochrome (graphics), Id 6 */
  mch640x200: seq.csi + "=6h",
  /** Enables line wrapping, Id 7 */
  enableLineWrap: seq.csi + "=7h",
  /** 320 x 200 color (graphics), Id 13 */
  col320x200: seq.csi + "=13h",
  /** 640 x 200 color (16-color graphics), Id 14 */
  col16_640x200: seq.csi + "=14h",
  /** 640 x 350 monochrome (2-color graphics), Id 15 */
  mch640x350: seq.csi + "=15h",
  /** 640 x 350 color (16-color graphics), Id 16 */
  col16_640x350: seq.csi + "=16h",
  /** 640 x 480 monochrome (2-color graphics), Id 17 */
  mch640x480: seq.csi + "=17h",
  /** 640 x 480 color (16-color graphics), Id 18 */
  col16_640x480: seq.csi + "=18h",
  /** 320 x 200 color (256-color graphics), Id 19 */
  col256_320x200: seq.csi + "=19h",
  /** Resets the mode by using the same values that Set Mode uses, except for 7, which disables line wrapping. The last character in this escape sequence is a lowercase L.
   * @param {number} id - Id of mode*/
  restore: id => seq.csi + `=${id}l`,
}

/** Screen Private Mode */
const scr_pmd = {
  /** Make cursor invisible */
  cursorHide: seq.csi + "?25l",
  /** Make cursor visible */
  cursorShow: seq.csi + "?25h",
  /** Restore screen */
  loadScreen: seq.csi + "?47l",
  /** Save screen */
  saveScreen: seq.csi + "?47h",
  /** Enables the alternative buffer */
  enableAltBuffer: seq.csi + "?1049h",
  /** Disables the alternative buffer */
  disableAltBuffer: seq.csi + "?1049l",
}

/** Screen */
const scr = { md: scr_md, pmd: scr_pmd }

/**
 * ANSI Escape
 * This file is contains strings and functions for generating ANSI Escape Sequences
 * For more info read: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
 */
const ansi = { seq, gen, crs, ers, col, scr }

export default ansi;
