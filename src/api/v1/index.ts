import { ParamData } from "path-to-regexp";
import { Logger } from "pino";
import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { Command, Router } from "../../scapi";
import ErrorResponse, { ResponseCode } from "../ErrorResponse";
import UserPermissions from "../UserPermissions";
import users from "./users";

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

export default (prisma: PrismaClient, logger?: Logger): Router => {
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

  v1.use("/users", users(prisma, logger));

  return v1;
};
