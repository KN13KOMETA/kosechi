import pino from "pino";
import { PrismaClient } from "../../generated/prisma/client";
import { Router } from "../../scapi";

export default (prisma: PrismaClient, logger?: pino.Logger): Router => {
  const v1 = new Router(logger);

  v1.read("/users/:userId", (req, stream) => {
    stream.write("User Id: " + req.params.userId);
    stream.exit(0);
    stream.end();
  });

  return v1;
};
