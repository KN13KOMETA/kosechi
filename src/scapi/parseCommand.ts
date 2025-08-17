import path from "path";
import { RouteType } from "./Router";

export interface Command {
  name: string;
  type: RouteType;
  path: string;
  json: object;
}

export default (s: string): Command => {
  const args = s.trim().split(/\s+/);
  let buf: any;
  let cmd: Command = {
    name: "",
    type: RouteType.Read,
    path: "",
    json: {},
  };

  if ((buf = args.shift()) == null) throw "Command name is null";
  cmd.name = buf;

  switch ((buf = args.shift())) {
    case "create":
      cmd.type = RouteType.Create;
      break;
    case "read":
      cmd.type = RouteType.Read;
      break;
    case "update":
      cmd.type = RouteType.Update;
      break;
    case "delete":
      cmd.type = RouteType.Delete;
      break;
    default:
      throw "Unknown command type";
  }

  if ((buf = args.shift()) == null) throw "Command path is null";
  cmd.path = path.normalize(buf);

  buf = args.join(" ");
  cmd.json = JSON.parse(buf);

  return cmd;
};
