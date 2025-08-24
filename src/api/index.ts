import { Router } from "../scapi";
import createLogger from "../createLogger";
import v1 from "./v1";
import { PrismaClient } from "../generated/prisma/client";
import packageJson from "../../package.json";
import ErrorResponse, { ResponseCode } from "./ErrorResponse";

type ApiStatus = {
  [key: string]: "discontinued" | "deprecated" | "available";
};

const apiStatus: ApiStatus = {
  v1: "available",
};

const welcomeMessage = JSON.stringify({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  author: packageJson.author,
  /** @type {[key: string]: "asd"} */
  api: apiStatus,
});

export default (prisma: PrismaClient): Router => {
  const logger = createLogger("api/main.pino");

  const root = new Router(logger);
  const api = new Router(logger);

  root.use("/api", api);

  api.read("/welcome", (_req, stream) => {
    stream.write(welcomeMessage);

    stream.exit(0);
    stream.end();
  });

  api.use("/v1", v1(prisma, createLogger("api/v1.pino")));

  root.use((_req, stream, next) => {
    const res = new ErrorResponse(ResponseCode.NotFound, {
      message: "",
      data: null,
    });

    stream.write(res.toString());
    stream.exit(res.code);
    stream.end();
  });

  return root;
};
