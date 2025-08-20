import { Router } from "../scapi";
import createLogger from "../createLogger";
import v1 from "./v1";

const logger = createLogger("api/main.pino");

const root = new Router(logger);
const api = new Router(logger);

root.use("/api", api);

api.read("/welcome", (req, stream) => {
  stream.write("Welcome to kosechi");
  stream.exit(0);
  stream.end();
});

api.use("/v1", v1);

export default root;
