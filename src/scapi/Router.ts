import { match, MatchFunction } from "path-to-regexp";
import { ServerChannel } from "ssh2";
import parseCommand, { Command } from "./parseCommand";

export interface RouteRequest {
  data: object;
  cmd: Command;
}

export type RouteCallback = (
  req: RouteRequest,
  stream: ServerChannel,
  next: Function | undefined,
) => void;

export enum RouteType {
  Create,
  Read,
  Update,
  Delete,
  Router,
  Middleware,
}

export type RouteHandler = RouteCallback | Router;

export interface Route {
  type: RouteType;
  path: string;
  matcher: MatchFunction<object>;
  handler: RouteHandler;
}

export class Router {
  #routes: Route[] = [];

  constructor() {}

  input(exec: string) {}

  #addRoute(type: RouteType, path: string, handler: RouteHandler) {
    this.#routes.push({
      type,
      path,
      matcher: match(path, { decode: decodeURIComponent }),
      handler,
    });
  }

  use(path: string, handler: RouteHandler) {
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
