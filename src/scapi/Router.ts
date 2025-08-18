import { Match, match, MatchFunction } from "path-to-regexp";
import { ServerChannel } from "ssh2";
import parseCommand, { Command } from "./parseCommand";
import path from "path";

const isSubDir = (parent: string, dir: string) => {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};

export interface RouteRequest {
  match: Match<object> | undefined;
  data: object;
  cmd: Command;
}

export type MiddlewareCallback = (
  req: RouteRequest,
  stream: ServerChannel,
  next: () => void,
) => void;

export type RouteCallback = (req: RouteRequest, stream: ServerChannel) => void;

export enum RouteType {
  Create,
  Read,
  Update,
  Delete,
  Router,
  Middleware,
}

export type RouteHandler = MiddlewareCallback | RouteCallback | Router;

export interface Route {
  type: RouteType;
  path: string;
  matcher: MatchFunction<object>;
  handler: RouteHandler;
}

export class Router {
  #routes: Route[] = [];

  constructor() {}

  inputRaw(exec: string, data: object = {}, stream: ServerChannel) {
    // console.log(parseCommand(exec));
    this.input({ match: undefined, cmd: parseCommand(exec), data }, stream);
    console.log("END\n");
  }
  input(req: RouteRequest, stream: ServerChannel) {
    mainloop: for (const route of this.#routes) {
      console.log(route.path);
      console.log(route.matcher(req.cmd.path));
      switch (route.type) {
        case RouteType.Router: {
          // if (typeof route.handler == "function")
          //   throw "Something went wrong, expected Router";
          //
          // route.handler.input(req);
          break;
        }
        case RouteType.Middleware: {
          if (typeof route.handler != "function")
            throw "Something went wrong, expected MiddlewareCallback";

          let next = false;
          if (route.path == "") {
            route.handler(req, stream, () => (next = true));
            if (!next) break mainloop;
          } else if (isSubDir(route.path, req.cmd.path)) {
            route.handler(req, stream, () => (next = true));
            if (!next) break mainloop;
          }
          break;
        }
        default: {
        }
      }
    }
  }

  #addRoute(type: RouteType, path: string, handler: RouteHandler) {
    this.#routes.push({
      type,
      path,
      matcher: match(path, { decode: decodeURIComponent }),
      handler,
    });
  }

  public use(handler: RouteHandler): void;
  public use(path: string, handler: RouteHandler): void;
  public use(path: string | RouteHandler, handler?: RouteHandler): void {
    if (typeof path != "string") {
      handler = path;
      path = "";
    } else if (handler == null) throw "Handler can't be undefined";

    if (handler instanceof Router)
      this.#addRoute(RouteType.Router, path, handler);
    else this.#addRoute(RouteType.Middleware, path, handler);
  }

  create(path: string, cb: RouteCallback) {
    this.#addRoute(RouteType.Create, path, cb);
  }
  read(path: string, cb: RouteCallback) {
    this.#addRoute(RouteType.Read, path, cb);
  }
  update(path: string, cb: RouteCallback) {
    this.#addRoute(RouteType.Update, path, cb);
  }
  delete(path: string, cb: RouteCallback) {
    this.#addRoute(RouteType.Delete, path, cb);
  }
}
