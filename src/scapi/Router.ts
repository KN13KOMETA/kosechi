import path from "path";
import {
  Match,
  match,
  MatchFunction,
  MatchResult,
  ParamData,
} from "path-to-regexp";
import pino from "pino";
import { ServerChannel } from "ssh2";
import parseCommand, { Command } from "./parseCommand";

const relativeDir = (parent: string, dir: string) => {
  const relative = path.relative(parent, dir);
  return relative == "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
    ? "/" + relative
    : false;
};

export interface RouteRequest<Params = false> {
  params: Params;
  data: object;
  cmd: Command;
}

export type MiddlewareCallback = (
  req: RouteRequest,
  stream: ServerChannel,
  next: () => void,
) => void;

export type RouteCallback = (
  req: RouteRequest<ParamData>,
  stream: ServerChannel,
) => void;

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
  #logger?: pino.Logger;

  constructor(logger?: pino.Logger) {
    this.#logger = logger;
  }

  inputRaw(exec: string, data: object = {}, stream: ServerChannel) {
    this.input({ params: false, cmd: parseCommand(exec), data }, stream);
  }

  input(req: RouteRequest<any>, stream: ServerChannel): boolean {
    const logger = this.#logger?.child({ req });

    logger?.info("new request");

    reqloop: for (const route of this.#routes) {
      const routeLogger = logger?.child({ route });

      if (
        route.type != RouteType.Router &&
        route.type != RouteType.Middleware &&
        req.cmd.type != route.type
      ) {
        routeLogger?.info("request and route type aren't same, continue");
        continue reqloop;
      }

      switch (route.type) {
        case RouteType.Router: {
          if (typeof route.handler == "function")
            throw "Something went wrong, expected Router";

          const relative = relativeDir(route.path, req.cmd.path);

          if (!relative) {
            routeLogger?.info("isn't subdir of router, continue");
            continue reqloop;
          }

          routeLogger?.info("subdir of router, redirecting request");
          req.cmd.path = relative;
          if (route.handler.input(req, stream)) return true;
          else {
            routeLogger?.info("didn't got response from router, continue");
            continue reqloop;
          }
        }
        case RouteType.Middleware: {
          if (typeof route.handler != "function")
            throw "Something went wrong, expected MiddlewareCallback";

          let next = false;
          if (route.path == "" || relativeDir(route.path, req.cmd.path)) {
            route.handler(req, stream, () => (next = true));
            if (!next) {
              routeLogger?.info("next is false, breaking");
              return true;
            }
            routeLogger?.info("next is true, continue");
            continue reqloop;
          }
          break;
        }
        // Handle CRUD requests
        default: {
          if (typeof route.handler != "function")
            throw "Something went wrong, expected RouteCallback";

          const match = route.matcher(req.cmd.path);

          if (!match) {
            routeLogger?.info("request doesn't match, continue");
            continue reqloop;
          }

          req.params = match.params;
          routeLogger?.info("request matches, run handler");
          route.handler(req, stream, () => { });
          return true;
        }
      }
    }

    return false;
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
