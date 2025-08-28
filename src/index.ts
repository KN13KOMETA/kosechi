import { createHash, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { Server as SshServer, utils } from "ssh2";
import createLogger from "./createLogger";
import { PrismaClient } from "./generated/prisma/client";
import sessionHandler from "./sessionHandler";
import initApi from "./api";
const { parseKey } = utils;

const logger = createLogger("main.pino");
const prisma = new PrismaClient();
const api = initApi(prisma);

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
    sessionHandler(accept(), api, userId, clientLogger.child({ id: userId }));
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
