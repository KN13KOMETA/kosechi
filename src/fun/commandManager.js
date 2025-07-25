import { directMessage as dm, systemUser as su } from "../index.js";
import ansi from "../sui/ansi.js";

const helpCmd = user => {
  dm(su, user, "List of available commands:");
  dm(su, user, "/help - prints this list");
  dm(su, user, "/quit - closes chat");
  dm(su, user, "/list - prints current users");
  dm(su, user, "/whisper [username || hash] \"Message\" - sends private message to user (if more than 1 user has same username use hash)");
  dm(su, user, "Aliases: help (h), quit (q, exit), list (l), whisper (w, tell)");
}
const listCmd = (user, userList) => {
  dm(su, user, "List of current users:");
  userList.forEach(u => {
    dm(su, user, `${u.username} / ${u.hash}`);
  });
}

/**
 * @param {import("../index.js").User} user
 * @param {string[]} args
 * @param {Map<string, import("../index.js").User>} userList
 */
const whisperCmd = (user, content, args, userList) => {
  /** @type {import("../index.js").User} */
  let target = null;
  let findhash = 0;

  for (const [_key, value] of userList) {
    if (value.username == args[0]) {
      target = userList.get(value.hash);
      findhash++;
    }
  }
  if (findhash != 1) target = null;
  if (findhash > 1) {
    dm(su, user, `There are ${findhash} users named ${args[0]}`);
    return;
  }
  if (!target && !userList.has(args[0])) {
    dm(su, user, `No user named: ${args[0]}`);
    return;
  }
  if (!target) target = userList.get(args[0]);
  let mc = [content.match(/\"(.*)\"/)];
  if (!Array.isArray(mc[0]) || mc[0][0]?.length < 1) {
    dm(su, user, "Nothing to send");
    return;
  }
  mc[0] = mc[0][0];
  mc[1] = `${user.username} / ${user.hash} whispered to you: ${mc[0]}`;
  mc[0] = `You whisper to ${target.username} / ${target.hash}: ${mc[0]}`;

  dm(su, user, mc[0]);
  dm(su, target, mc[1]);
}
/**
 * @param {import("../index.js").User} user
 * @param {string} content
 * @param {import("../index.js").User[]} userList
 */
export const runCommand = (user, content, userList) => {
  if (!content.startsWith("/")) return false;

  dm(user, user, content);

  const args = content.slice(1).split(/[ ]+/);
  const cmd = args.shift();
  switch (cmd) {
    case "help": case "h": helpCmd(user); break;
    case "quit": case "q": case "exit": {
      user.channel.write(ansi.scr.pmd.cursorShow + ansi.scr.pmd.disableAltBuffer);
      user.channel.end();
      break;
    }
    case "list": case "l": listCmd(user, userList); break;
    case "whisper": case "w": case "tell": whisperCmd(user, content, args, userList); break;
    default: dm(su, user, `No command named ${cmd}`); break;
  }

  return true;
}
