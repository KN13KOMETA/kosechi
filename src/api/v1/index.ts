import pino from "pino";
import { PrismaClient } from "../../generated/prisma/client";
import { Router } from "../../scapi";
import ErrorResponse, { ResponseCode } from "../ErrorResponse";
import { ServerChannel } from "ssh2";

const validatePositiveNumber = (
  name: string,
  x: any,
  stream: ServerChannel,
) => {
  if (Number.isSafeInteger(x) && x >= 0) return true;

  const res = new ErrorResponse(ResponseCode.BadRequest, {
    message: name + " must positive number",
    data: null,
  });
  stream.write(res.toString());
  stream.exit(res.code);
  stream.end();

  return false;
};

export default (prisma: PrismaClient, logger?: pino.Logger): Router => {
  const v1 = new Router(logger);

  v1.use((req, stream, next) => {
    if (typeof req.data.userId == "number") return next();

    const res = new ErrorResponse(ResponseCode.ImATeapot, {
      message: "Internal Server Error: userId doesn't exists",
      data: null,
    });
    stream.write(res.toString());
    stream.exit(res.code);
    stream.end();
  });

  v1.read("/users/:userId", async (req, stream) => {
    const id = Number(req.params.userId);
    if (!validatePositiveNumber("userId", id, stream)) return;

    const user = await prisma.user.findUnique({ where: { id } });
    stream.write(JSON.stringify(user));
    stream.exit(0);
    stream.end();
  });

  return v1;
};
