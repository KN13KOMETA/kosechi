import { Logger } from "pino";
import { PrismaClient } from "../../generated/prisma/client";
import { Router } from "../../scapi";
import {
  checkPositiveNumber,
  validatePositiveNumber,
  validateSelect,
} from "./fun";
import ErrorResponse, { ResponseCode } from "../ErrorResponse";
import { UserRouteRequest } from ".";

const wl = {
  user: [
    "id",
    "displayName",
    "name",
    "description",
    "pubKeyHash",
    "firstSeen",
    "lastSeen",

    "inviterId",
    "inviterComment",
    "invitedAt",
  ],
};

export default (prisma: PrismaClient, logger?: Logger): Router => {
  const users = new Router(logger);

  users.read("/", async (req, stream) => {
    let startId = Number(req.cmd.json.startId);
    let count = Number(req.cmd.json.count);

    if (!checkPositiveNumber(startId) || !checkPositiveNumber(count)) {
      startId = 0;
      count = 50;
    }

    if (
      req.cmd.json.select != null &&
      !validateSelect(req.cmd.json.select, wl.user, stream)
    )
      return;

    const users = await prisma.user.findMany({
      where: {
        id: {
          gte: startId,
        },
      },
      select: req.cmd.json.select,
      orderBy: {
        id: "asc",
      },
      take: count,
    });

    stream.write(JSON.stringify(users));
    stream.exit(0);
    stream.end();
  });

  users.read("/:userId", async (req: UserRouteRequest, stream) => {
    const id = Number(req.params.userId);
    if (!validatePositiveNumber("userId", id, stream)) return;

    scx;
    if (
      req.cmd.json.select != null &&
      !validateSelect(req.cmd.json.select, wl.user, stream)
    )
      return;

    const user = await prisma.user.findUnique({
      where: { id },
      select: req.cmd.json.select,
    });
    stream.write(JSON.stringify(user));
    stream.exit(0);
    stream.end();
  });

    const id = Number(req.params.userId);
    if (!validatePositiveNumber("userId", id, stream)) return;

    const user = await prisma.user.findUnique({ where: { id } });
    stream.write(JSON.stringify(user));
    stream.exit(0);
    stream.end();
  });

  return users;
};
