import pino from "pino";
import { PrismaClient } from "../../generated/prisma/client";
import { Router } from "../../scapi";
import ErrorResponse, { ResponseCode } from "../ErrorResponse";

export default (prisma: PrismaClient, logger?: pino.Logger): Router => {
  const v1 = new Router(logger);

  v1.read("/users/:userId", async (req, stream) => {
    if (typeof req.params.userId != "string") {
      const res = new ErrorResponse(ResponseCode.BadRequest, {
        message: "userId must be string",
        data: null,
      });
      stream.write(res.toString());
      stream.exit(res.code);
      return stream.end();
    }

    const id = Number(req.params.userId);
    if (!Number.isSafeInteger(id) || id < 0) {
      const res = new ErrorResponse(ResponseCode.BadRequest, {
        message: "userId must positive number",
        data: null,
      });
      stream.write(res.toString());
      stream.exit(res.code);
      return stream.end();
    }

    const user = await prisma.user.findUnique({ where: { id } });
    stream.write(JSON.stringify(user));
    stream.exit(0);
    stream.end();
  });

  return v1;
};
