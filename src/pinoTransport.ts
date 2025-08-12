import { createWriteStream } from "fs";

export default (options: { destination: string }) =>
  createWriteStream(options.destination);
