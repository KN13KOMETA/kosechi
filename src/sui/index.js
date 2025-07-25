import { stdin } from "process"
import ansi from "./ansi.js"
import identifyKey from "./identifyKey.js"

export * from "./ansi.js"
export * from "./identifyKey.js"

/**
 * @typedef {[number, number]} Point - Can be interpreted as [width, height] or [x, y]
 *
 * @typedef {Object} Vobj - Describes virtual object on terminal
 * @property {DrawFunction} draw
 * @property {Point} pos
 * @property {Point} size
 * @property {SizeUpdate} sizeUpdate
 *
 * @callback InpUpdate
 * @param {WriteFunction} w
 * @param {Point} size
 * @param {Buffer} char
 *
 * @typedef {Object} InpVobjProp
 * @property {InpUpdate} update - Emitted when new char appear
 * @property {WriteFunction} cb
 * @property {Point} minMaxLength
 * @property {string} content
 *
 * @typedef {Vobj & InpVobjProp} InpVobj
 *
 * @callback SizeUpdate - Emitted when size updated
 * @param {WriteFunction} w
 * @param {Point} size
 *
 * @callback WriteFunction - Content sends here (probably stdout)
 * @param {string} content
 *
 * @callback DrawFunction - Used to draw something
 * @param {WriteFunction} w
 * @param {Point} size
 */

export const ef = _ => { }

/**
 * @param {DrawFunction} draw
 * @param {Point} pos
 * @param {Point} size
 * @param {SizeUpdate} sizeUpdate
 * @returns {Vobj}
 */
export const createVobj = (draw = ef, pos = [0, 0], size = [0, 0], sizeUpdate = ef) => ({ draw, pos, size, sizeUpdate });
/**
 * @param {InpUpdate} update
 * @param {WriteFunction} cb
 * @param {Point} minMaxLength
 * @param {string} content
 * @returns {InpVobj}
 */
export const createInpVobj = (base = createVobj(), update = ef, cb = ef, minMaxLength = [1, 32], content = "") => {
  /** @type {InpVobj} */
  base.update = update;
  base.cb = cb;
  base.minMaxLength = minMaxLength;
  base.content = content;

  return base;
}

export class Sui {
  /** How much times press ^C in a row to exit process */
  panicMode = 0;
  onPanicMode = ef;
  #panicCounter = 0;
  /** @type {WriteFunction} */
  w = ef;
  /** @type {Point} */
  #size = [0, 0];
  /** @type {Vobj[]} */
  #vobjList = [];
  /** @type {InpVobj} */
  #inpVobj = createInpVobj();
  /** @type {Vobj[]} */
  userVobjList = [];

  /**
   * @param {WriteFunction} w
   * @param {Point} size
   * @param {Vobj[]} userVobjList
   */
  constructor(w, size, userVobjList) {
    this.w = w;
    this.#size = size;
    this.userVobjList = userVobjList;

    this.forceUpdate();
  }

  get size() { return this.#size; }
  set size(nsize) {
    this.#size = nsize;

    for (let vobj of this.userVobjList) vobj.sizeUpdate(this.w, this.#size);
    this.#inpVobj.sizeUpdate(this.w, this.#size);
    for (let vobj of this.#vobjList) vobj.sizeUpdate(this.w, this.#size);
  }

  forceUpdate() {
    for (let vobj of this.userVobjList) vobj.draw(this.w, this.#size);
    this.#inpVobj.draw(this.w, this.#size);
    for (let vobj of this.#vobjList) vobj.draw(this.w, this.#size);

    for (let vobj of this.userVobjList) vobj.sizeUpdate(this.w, this.#size);
    this.#inpVobj.sizeUpdate(this.w, this.#size);
    for (let vobj of this.#vobjList) vobj.sizeUpdate(this.w, this.#size);
  }

  /** @param {Buffer} ch */
  input(ch) {
    if (!Buffer.isBuffer(ch)) return;
    if (this.panicMode > 0 && ch.toString().match("\x03")?.length == 1) {
      this.#panicCounter++;
      if (this.#panicCounter >= this.panicMode) {
        this.onPanicMode();
        process.exit(0);
      }
    } else {
      this.#panicCounter = 0;
      this.#inpVobj.update(this.w, this.#size, ch);
    }
  }

  /**
   * @param {InpVobj} baseVobj - update will be overwrited
   * @param {WriteFunction} cb - Content will be sended here after Enter pressed
   */
  spawnInputVobj(baseVobj) {
    baseVobj.update = (w, s, ch) => {
      for (let [text, key] of identifyKey(ch)) {
        if (
          key && key.name != "`" && key.name != key.sequence.toLowerCase() &&
          !["`", "backspace", "return", "space"].includes(key.name)
        ) return;
        if (key) {
          switch (key.name) {
            case "`": text = ""; break;
            case "backspace": {
              baseVobj.content = baseVobj.content.slice(0, -1);
              text = "";
              break;
            }
            case "return": {
              if (baseVobj.content.trim().length >= baseVobj.minMaxLength[0]) {
                baseVobj.cb(baseVobj.content.trim());
                baseVobj.content = "";
              }
              text = "";
              break;
            }
          }
        }

        if ((baseVobj.content.length + text.length) > baseVobj.minMaxLength[1]) return;
        baseVobj.content += text;
      }

      w(
        ansi.crs.moveTo(baseVobj.pos[0], baseVobj.pos[1]) + ansi.ers.cursorLineEnd +
        baseVobj.content + ansi.col.md.blinking.set + "_" + ansi.col.md.blinking.res
      );

      baseVobj.draw(w, s);
    }

    this.#inpVobj = baseVobj;
    this.#inpVobj.draw(this.w, this.#size);
    this.#inpVobj.sizeUpdate(this.w, this.#size);
  }
}

