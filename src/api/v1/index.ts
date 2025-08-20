import createLogger from "../../createLogger";
import { Router } from "../../scapi";

const v1 = new Router(createLogger("api/v1.pino"));

v1.read("/users/:userId", (req, stream) => {
  stream.write("User Id: " + req.params.userId);
  stream.exit(0);
  stream.end();
});

export default v1;
