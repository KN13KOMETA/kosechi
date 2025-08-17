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
  let parse: Command = {
    name: "",
    type: RouteType.Read,
    path: "",
    json: {},
  };

  if ((buf = args.shift()) == null) throw "Command name is null";
  parse.name = buf;

  switch ((buf = args.shift())) {
    case "create":
      parse.type = RouteType.Create;
      break;
    case "read":
      parse.type = RouteType.Read;
      break;
    case "update":
      parse.type = RouteType.Update;
      break;
    case "delete":
      parse.type = RouteType.Delete;
      break;
    default:
      throw "Unknown command type";
  }

  if ((buf = args.shift()) == null) throw "Command path is null";
  parse.path = buf;

  buf = args.join(" ");
  parse.json = JSON.parse(buf);

  return parse;
};
