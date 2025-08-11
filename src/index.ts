import { createHash } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { Server as SshServer, utils } from "ssh2";
import { PrismaClient } from "./generated/prisma/client";
import { System } from "./System";
const { parseKey } = utils;

const calcFingerprint = (publicKey: string, algo: string = "sha256") => {
  const hash = createHash(algo).update(publicKey).digest("base64");
  return hash;
};

const prisma = new PrismaClient();
const main = async () => { };

{
  System.initNew(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

// awk '{printf "%s", $2}' < cf-chat_ed25519.pub | sha256sum

const PORT = 13022;
const hostname = "";
const SERVER_KEY = readFileSync(
  path.join(__dirname, "../o/chatserver_ed25519"),
);

const serverKey = parseKey(SERVER_KEY);

if (serverKey instanceof Error) throw serverKey;

// TODO: pqc algorithms
// TODO: server options
const sshServer = new SshServer({
  hostKeys: [SERVER_KEY],
  algorithms: {
    serverHostKey: ["ssh-ed25519"],
    kex: ["curve25519-sha256"],
    cipher: ["chacha20-poly1305@openssh.com"],
    compress: ["none"],
  },
});

sshServer.on("connection", (client, info) => {
  console.log(info);

  client.on("openssh.streamlocal", (accept, reject, info) => {
    console.log("conn openssh.streamlocal");
    console.log(info);
  });
  client.on("tcpip", (accept, reject, info) => {
    console.log("conn tcpip");
    console.log(info);
    accept();
  });
  client.on("rekey", () => console.log("conn rekey"));
  client.on("request", (accept, reject, name, info) => {
    console.log("conn request");
    console.log(name);
    console.log(info);
    // @ts-ignore
    accept();
  });
  client.on("greeting", (greeting) => {
    console.log("conn greeting");
    console.log(greeting);
  });

  client.on("handshake", (negotiated) => {
    console.log("Client handshake");
    console.log(negotiated);
  });
  client.on("authentication", (ctx) => {
    console.log("Client authentication");

    console.log(ctx.method);

    if (ctx.method == "publickey") {
      console.log("signature");
      console.log(ctx.signature?.toString("hex"));
      console.log("key data");
      console.log(ctx.key.data.toString("base64"));
      console.log("fingerprint");
      console.log(calcFingerprint(ctx.key.data.toString("base64")));
      console.log(
        calcFingerprint(ctx.key.data.toString("base64"), "BLAKE2s256"),
      );
      console.log(ctx.key);
      console.log(ctx.blob);
      // @ts-ignore
      console.log(calcFingerprint(ctx.blob));
      if (ctx.blob) ctx.accept();
    } else {
      ctx.reject();
    }
  });
  client.on("ready", () => console.log("conn ready"));
  client.on("session", (accept, reject) => {
    console.log("conn session");
    const session = accept();
  });

  client.on("end", () => console.log("Client disconnected"));
  client.on("close", () => console.log("Client closed"));

  client.on("error", (err) => {
    console.log("Client error");
    console.log(err);
  });
});

sshServer.listen(PORT, hostname, () => {
  let addr = sshServer.address();

  if (addr == null) {
    addr = "unknown";
  } else if (typeof addr != "string") {
    addr = `(${addr.family}) ${addr.address}:${addr.port}`;
  }

  console.log(`Listening on ${addr}`);
});
