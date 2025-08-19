import createLogger from "../../createLogger";
import { Router } from "../../scapi";

const apiv1 = new Router(createLogger("api/v1.pino"));

export default apiv1;
