import { createHash, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { Server as SshServer, utils } from "ssh2";
import { PrismaClient } from "./generated/prisma/client";
import pino from "pino";
import sessionHandler from "./sessionHandler";
// import { System } from "./System";
const { parseKey } = utils;

const logger = pino(
  pino.transport({
    target: path.join(__dirname, "pinoTransport" + path.extname(__filename)),
    options: {
      destination: path.join(__dirname, "../logs.pino"),
    },
  }),
);

const checkValue = (input: Buffer, allowed: Buffer) => {
  const autoReject = input.length !== allowed.length;
  if (autoReject) {
    // Prevent leaking length information by always making a comparison with the
    // same input when lengths don't match what we expect ...
    allowed = input;
  }
  const isMatch = timingSafeEqual(input, allowed);
  return !autoReject && isMatch;
};

// Little oneliner to get public key hash
// awk '{printf $2}' < cf-chat_ed25519.pub | openssl dgst -sha256 -binary | base64

const prisma = new PrismaClient();
const main = async () => { };

const serverKeyPath = path.join(__dirname, "../o/chatserver_ed25519");

const config = {
  port: 13022,
  hostname: "",
  serverKey: {
    content: readFileSync(serverKeyPath),
    key: (() => {
      const key = parseKey(readFileSync(serverKeyPath));
      if (key instanceof Error) throw key;
      return key;
    })(),
  },
  pubKeyHashAlgo: "sha256",
};

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });

// awk '{printf "%s", $2}' < cf-chat_ed25519.pub | sha256sum

// TODO: server options
const sshServer = new SshServer({
  hostKeys: [config.serverKey.content],
  algorithms: {
    serverHostKey: ["ssh-ed25519"],
    kex: ["curve25519-sha256"],
    cipher: ["chacha20-poly1305@openssh.com"],
    compress: ["none"],
  },
});

sshServer.on("connection", (client, info) => {
  const clientLogger = logger.child({
    ip: info.ip,
  });
  let userId: number | null = null;

  clientLogger.info("client connect");

  client.on("authentication", async (ctx) => {
    clientLogger.info("authentication");

    if (ctx.method != "publickey") return ctx.reject(["publickey"]);
    if (config.serverKey.key.type != ctx.key.algo) return ctx.reject();

    const pubKeyHash = createHash(config.pubKeyHashAlgo)
      .update(ctx.key.data)
      .digest("base64");
    const user = await prisma.user.findUnique({
      where: { pubKeyHash },
      select: { id: true, pubKeyHash: true },
    });
    const pubKey = parseKey(ctx.key.data);

    if (
      !user ||
      (ctx.signature &&
        ctx.blob &&
        (pubKey instanceof Error ||
          !pubKey.verify(ctx.blob, ctx.signature, ctx.hashAlgo)))
    )
      return ctx.reject();

    userId = user.id;
    ctx.accept();
  });

  client.on("ready", () => {
    clientLogger.info("client authentificated");
  });
  client.on("session", (accept, reject) => {
    if (userId == null) {
      clientLogger.error("user is null");
      clientLogger.error(info);
      return reject();
    }
    sessionHandler(accept(), userId, clientLogger.child({ id: userId }));
  });
  client.on("error", (err) => clientLogger.info(err));
  client.once("close", () => clientLogger.info("client disconnect"));
});

sshServer.listen(config.port, config.hostname, () => {
  let addr = sshServer.address();

  if (addr == null) {
    addr = "unknown";
  } else if (typeof addr != "string") {
    addr = `(${addr.family}) ${addr.address}:${addr.port}`;
  }

  logger.info(`listening on ${addr}`);
});
