// ssh-keygen -t ed25519 -f keyname_ed25519 -N "passphrase" -C comment
// Get fingerprint
// ssh-keygen -lf keyname
// Get fingerprint and randomart
// ssh-keygen -lvf keyname
import { readFileSync } from "fs";
import ssh2 from "ssh2";
import crypto from "crypto";
import { Sui } from "./sui/index.js";
import { initChatInterface } from "./fun/chatInterface.js";
import { runCommand } from "./fun/commandManager.js";

const PORT = 13022;
/**
 * @typedef {{
 * username: string,
 * pkey: ssh2.ParsedKey,
 * hash: string,
 * channel: ssh2.Channel,
 * sui: Sui,
 * uptime: number,
 * chatbox: import("./fun/chatInterface.js").Message[],
 * }} User */
/** @type {Map<string, User>} */
const userList = new Map();

/** @type {User} */
export const systemUser = {
  username: "SYSTEM",
  hash: "_SYSTEM_SYSTEM_SYSTEM_",
};

export const directMessage = (author, target, content) => {
  /** @type {import("./chatInterface.js").Message} */
  const msg = {
    username: author.username,
    hash: author.hash,
    content,
    date: new Date().toISOString().substr(11, 8),
  };
  target.chatbox.push(msg);
  target.sui.userVobjList[2].msgList = target.chatbox;
  target.sui.userVobjList[2].draw(
    (c) => target.channel.write(c),
    [target.channel.columns, target.channel.rows],
  );
};

/**
 * @param {User} author
 */
export const globalMessage = (author, content) => {
  /** @type {import("./fun/chatInterface.js").Message} */
  const msg = {
    username: author.username,
    hash: author.hash,
    content,
    date: new Date().toISOString().substr(11, 8),
  };
  userList.forEach((user) => {
    user.chatbox.push(msg);
    if (user.sui) {
      user.sui.userVobjList[2].msgList = user.chatbox;
      user.sui.userVobjList[2].draw(
        (c) => user.channel.write(c),
        [user.channel.columns, user.channel.rows],
      );
    }
  });
};

setInterval(() => {
  userList.forEach((user) => {
    if (!user.sui) return;
    user.sui.userVobjList[1].draw(
      (c) => user.channel.write(c),
      [user.channel.columns, user.channel.rows],
    );
    user.uptime++;
  });
}, 1000);

const sshsrv = new ssh2.Server({
  // algorithms: {
  // cipher
  // compress: ["zlib@openssh.com"],
  // hmac
  // kex
  // serverHostKey: ["ssh-ed25519"],
  // },
  // banner
  // debug
  // greetings
  // highWaterMark
  hostKeys: [
    {
      key: readFileSync("chatserver_ed25519"),
      passphrase: "",
    },
  ],
  // ident: "cts-alpha"
});

function checkValue(input, allowed) {
  const autoReject = input.length !== allowed.length;
  if (autoReject) {
    // Prevent leaking length information by always making a comparison with the
    // same input when lengths don't match what we expect ...
    allowed = input;
  }
  const isMatch = crypto.timingSafeEqual(input, allowed);
  return !autoReject && isMatch;
}

sshsrv.on("connection", (client) => {
  /** @type {User} */
  let user;

  client.on("authentication", (ctx) => {
    if (ctx.method != "publickey" || ctx.key.algo != "ssh-ed25519")
      return ctx.reject(["publickey", "ed25519"]);

    user = {
      username: ctx.username,
      pkey: ssh2.utils.parseKey(ctx.key.data),
      hash: crypto.hash("md5", ctx.key.data, "base64url"),
      uptime: 0,
      chatbox: [],
    };

    if (!userList.has(user.hash)) {
      console.log(`Registering user ${user.hash}.`);

      userList.set(user.hash, user);

      return ctx.accept();
    }

    const reqUser = userList.get(user.hash);

    if (
      !checkValue(ctx.key.data, reqUser.pkey.getPublicSSH()) ||
      (ctx.signature &&
        reqUser.pkey.verify(ctx.blob, ctx.signature, ctx.hashAlgo) != true)
    ) {
      return ctx.reject();
    }

    if (user.username != reqUser.username) userList.set(user.hash, user);

    ctx.accept();
  });

  client.on("ready", () => {
    console.log(`Logging user ${user.hash}.`);
    globalMessage(systemUser, `${user.username} / ${user.hash} joined chat`);

    let size = [0, 0];

    client.once("session", (accept, _reject) => {
      /** @type {ssh2.Session} */
      const session = accept();
      session.once("pty", (accept, _reject, info) => {
        size = [info.cols, info.rows];
        accept && accept();
      });

      session.on("window-change", (accept, _reject, info) => {
        size = [info.cols, info.rows];
        if (user.sui) {
          user.channel.columns = size[0];
          user.channel.rows = size[1];
          user.sui.size = size;

          userList.set(user.hash, user);
        }
        accept && accept();
      });

      session.once("shell", (accept, _reject) => {
        user.channel = accept();
        user.sui = initChatInterface(
          (c) => user.channel.write(c),
          (m) => {
            const isCommand = runCommand(user, m, userList);
            if (isCommand) return;
            globalMessage(user, m);
          },
          size,
          () => {
            const date = new Date(null);
            date.setSeconds(user.uptime);
            return [
              "kosechi 1.0.0-beta",
              date.toISOString().substr(11, 8),
              user.username + " / " + user.hash,
            ];
          },
          user.channel.end,
        );

        user.channel.columns = size[0];
        user.channel.rows = size[1];
        user.channel.isTTY = true;
        user.channel.setRawMode = (_v) => { };
        user.channel.on("error", (_v) => { });

        userList.set(user.hash, user);

        user.channel.on("readable", () => {
          /** @type {Buffer} */
          const char = user.channel.read();
          user.sui.input(char);
        });
      });
    });
  });

  client.on("close", () => {
    // TODO: Delayed user delete
    if (userList.has(user?.hash)) {
      globalMessage(systemUser, `${user.username} / ${user.hash} left chat`);
      userList.delete(user.hash);
    }
  });

  client.on("error", (err) => { });
});

sshsrv.listen(PORT, () => console.log(`Listening on ${PORT}`));
