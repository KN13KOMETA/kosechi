// import { createInterface } from "readline";
// import { createInterface } from "readline/promises";
// import { PrismaClient } from "./generated/prisma/client";
// import type { SystemConfig } from "./generated/prisma/client";
// import { stat } from "fs/promises";
//
// // TODO: Make this auotogenerate too
// export class System {
//   #config: SystemConfig;
//
//   constructor(config: SystemConfig) {
//     this.#config = config;
//   }
//
//   get config(): SystemConfig {
//     return this.#config;
//   }
//
//   static async init(prisma: PrismaClient): Promise<System | null> {
//     const query = await prisma.systemConfig.findFirst();
//
//     return query ? new System(query) : null;
//   }
//
//   static async initNew(prisma: PrismaClient): Promise<System | null> {
//     const rlInterface = createInterface(process.stdin, process.stdout);
//
//     const config: SystemConfig = {
//       id: 0,
//       keyPath: "",
//       host: "127.0.0.1",
//       port: 13022,
//       pubKeyHashAlgo: "sha256",
//     };
//
//     let input = (
//       await rlInterface.question("Enter path to server key: ")
//     ).trim();
//
//     config.keyPath = input.trim();
//
//     if (!(await stat(config.keyPath)).isFile()) throw "Path is not a file";
//
//     input = (
//       await rlInterface.question(`Enter host, default (${config.host}): `)
//     ).trim();
//
//     if (input.length) config.host = input;
//
//     input = (
//       await rlInterface.question(`Enter port, default (${config.port}): `)
//     ).trim();
//
//     // TODO: Number check
//     if (input.length) config.port = Number(input);
//
//     input = (
//       await rlInterface.question(
//         `Enter public key hash algo, default (${config.pubKeyHashAlgo}): `,
//       )
//     ).trim();
//
//     if (input.length) config.pubKeyHashAlgo = input;
//
//     console.log(config);
//
//     return null;
//   }
// }
