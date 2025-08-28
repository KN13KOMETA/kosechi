import pino from "pino";
import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { Command, Router, RouteRequest } from "../../scapi";
import ErrorResponse, { ResponseCode } from "../ErrorResponse";
import { ServerChannel } from "ssh2";
import UserPermissions from "../UserPermissions";
import { ParamData } from "path-to-regexp";

const checkPositiveNumber = (x: any) => Number.isSafeInteger(x) && x >= 0;
const validatePositiveNumber = (
  name: string,
  x: any,
  stream: ServerChannel,
) => {
  if (checkPositiveNumber(x)) return true;

  const res = new ErrorResponse(ResponseCode.BadRequest, {
    message: name + " must positive number",
    data: null,
  });
  stream.write(res.toString());
  stream.exit(res.code);
  stream.end();

  return false;
};

export interface UserRouteRequest<Params = ParamData> {
  params: Params;
  data: {
    userId: number;
    userPerms: UserPermissions;
    user: Prisma.UserGetPayload<{
      include: {
        roles: {
          select: {
            id: true;
            order: true;
            permissions: true;
          };
        };
      };
    }>;
  };
  cmd: Command;
}

export default (prisma: PrismaClient, logger?: pino.Logger): Router => {
  const v1 = new Router(logger);

  v1.use(async (req, stream, next) => {
    if (typeof req.data.userId != "number") {
      const res = new ErrorResponse(ResponseCode.ImATeapot, {
        message: "Internal Server Error: userId doesn't exists",
        data: null,
      });
      stream.write(res.toString());
      stream.exit(res.code);
      stream.end();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.data.userId },
      include: {
        roles: {
          select: {
            id: true,
            order: true,
            permissions: true,
          },
        },
      },
    });
    if (user == null) {
      const res = new ErrorResponse(ResponseCode.ImATeapot, {
        message: "Internal Server Error: user doesn't exists",
        data: null,
      });
      stream.write(res.toString());
      stream.exit(res.code);
      stream.end();
      return;
    }

    const userPerms = new UserPermissions();
    const tPerms = new UserPermissions();

    for (const role of user.roles) {
      tPerms.perms = role.permissions;
      if (tPerms.manageChannels) userPerms.manageChannels = true;
      if (tPerms.manageRoles) userPerms.manageRoles = true;
      if (tPerms.inviteUsers) userPerms.inviteUsers = true;
      if (tPerms.manageUsers) userPerms.manageUsers = true;
      if (tPerms.admin) userPerms.admin = true;
      if (tPerms.superadmin) userPerms.superadmin = true;
    }

    req.data.user = user;
    req.data.userPerms = userPerms;

    return next();
  });

  v1.read("/users", async (req, stream) => {
    let startId = Number(req.cmd.json.startId);
    let count = Number(req.cmd.json.count);

    if (!checkPositiveNumber(startId) || !checkPositiveNumber(count)) {
      startId = 0;
      count = 50;
    }

    try {
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
    } catch (err) {
      const res = new ErrorResponse(ResponseCode.BadRequest, {
        message: "Bad Select",
        data: null,
      });

      stream.write(res.toString());
      stream.exit(res.code);
    }

    stream.end();
  });

  v1.read("/users/:userId", async (req: UserRouteRequest, stream) => {
    const id = Number(req.params.userId);
    if (!validatePositiveNumber("userId", id, stream)) return;

    const user = await prisma.user.findUnique({ where: { id } });
    stream.write(JSON.stringify(user));
    stream.exit(0);
    stream.end();
  });

  return v1;
};
