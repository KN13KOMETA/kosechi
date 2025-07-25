import { Sui, createInpVobj, createVobj, ef } from "../sui/index.js";
import ansi from "../sui/ansi.js";

/**
 * @typedef {{
 *   username: string,
 *   hash: string,
 *   content: string,
 *   date: string
 * }} Message
 *
 * @callback getStatus
 * @returns {[string, string, string]}
 *
 * @param {import("../sui/index.js").WriteFunction} write - input
 * @param {WriteFunction} callback - output
 * @param {import("../sui/index.js").Point} size
 * @param {getStatus} getStatus
 * @returns {Sui}
 */
export const initChatInterface = (write, callback, size, getStatus, close) => {
  try {
    const voidVobj = createVobj(ef, [0, 0], [0, 0], w => w(ansi.ers.screen));
    const statusBarVobj = createVobj(
      (w, s) => {
        const t = getStatus();
        const w1 = Math.floor((s[0] - 4) / 2 - t[0].length - t[1].length / 2);
        let line = t[0] + " ".repeat(w1) + t[1];
        line += " ".repeat(s[0] - 4 - line.length - t[2].length) + t[2];
        line = "| " + line + " |";
        w(
          ansi.crs.home + ansi.ers.cursorLineEnd + line +
          ansi.crs.moveNextLine(1) + `+${"-".repeat(s[0] - 2)}+`
        );
      },
      [0, 0],
      [0, 0],
    );
    statusBarVobj.sizeUpdate = (w, s) => statusBarVobj.draw(w, s);

    const inpVobj = createInpVobj(createVobj(
      ef,
      [0, 0],
      [0, 0],
    ), ef, m => {
      callback(m);
    }, [1, 64], "/help");

    inpVobj.draw = (w, s) => {
      w(
        ansi.crs.moveTo(0, s[1] - 2) + `+${"-".repeat(s[0] - 2)}+` +
        ansi.crs.moveNextLine(1) + "|" + ansi.crs.moveX(s[0] - 1) + "|"
      );
    }
    inpVobj.sizeUpdate = (w, s) => {
      inpVobj.pos = [2, s[1]];
      inpVobj.size = [s[0] - 64];
      inpVobj.update(w, s, Buffer.from([0]));
    }

    /**
     * @param {Message} m
     * @param {number} w - Width
     */
    const constructAuthorTitle = (m, w) => {
      const d = [m.date, m.username, m.hash];
      return `[ ${ansi.col.md.inverse.set + d[0] + ansi.col.md.inverse.res} ] ${d[1]} ${" ".repeat(w - 8 - d[0].length - d[1].length - d[2].length)}${d[2]} |`;
    }
    const fixMessageContent = (c, w) => {
      const spl = c.match(new RegExp(".{1," + w + "}", "g"));
      return spl;
    }

    /**
     *
     * @typedef {Object} ChatboxProp
     * @property {Message[]} msgList
     *
     * @typedef {import("../sui/index.js").Vobj & ChatboxProp} ChatboxVobj
     *
     * @type {ChatboxVobj}
     */
    const chatboxVobj = createVobj(ef, [0, 0], [0, 0],);
    chatboxVobj.draw = (w, s) => {
      const maxy = chatboxVobj.size[1];
      const ml = chatboxVobj.msgList;
      let content = [];
      if (!ml) return;

      for (let i = ml.length - 1, y = 0; i >= 0 && y < maxy; i--) {
        const m = ml[i];
        const mn = i - 1 >= 0 ? ml[i - 1] : null;
        const mcont = [];

        if (m.hash != mn?.hash) mcont.unshift(constructAuthorTitle(m, chatboxVobj.size[0]));
        for (const line of fixMessageContent(m.content, chatboxVobj.size[0])) mcont.unshift(line);
        for (const line of mcont) content.unshift(line);
        y += mcont.length;
      }

      content = content.slice(-maxy);
      while (content.length != maxy) content.unshift("");

      for (let i = 0; i < content.length; i++) {
        const line = content[i];
        w(ansi.crs.moveTo(0, chatboxVobj.pos[1] + i) + line + ansi.ers.cursorLineEnd);
      }
    }
    chatboxVobj.sizeUpdate = (w, s) => {
      chatboxVobj.pos = [0, 2];
      chatboxVobj.size = [s[0], s[1] - 4];
      chatboxVobj.draw(w, s);
    }

    write(ansi.scr.pmd.cursorHide + ansi.scr.pmd.enableAltBuffer);

    const sui = new Sui(
      write,
      size,
      [voidVobj, statusBarVobj, chatboxVobj]
    );

    // sui.panicMode = 3;
    // sui.onPanicMode = () => write(ansi.scr.pmd.cursorShow + ansi.scr.pmd.disableAltBuffer);

    sui.spawnInputVobj(inpVobj);

    return sui;
  } catch (e) {
    close();
    console.log(e);
  }
}



// process.stdin.setRawMode(true);
// const sui = initChatInterface(c => process.stdout.write(c), ef, () => ([
// "K SSH Chat v1.0.0",
//   "00:00:00",
//   "clintflames / 8c71fb3f7593543f2ad180d31148a7cf"
//         ]));
// process.stdout.on("resize", () => sui.size = [process.stdout.columns, process.stdout.rows]);
// process.stdin.on("data", ch => sui.input(ch));
