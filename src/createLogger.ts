import { existsSync, mkdirSync } from "fs";
import path from "path";
import pino, { Logger } from "pino";

const logsDir = path.join(__dirname, "../logs");

export default (p: string): Logger => {
  const filePath = path.join(logsDir, p);
  const dirPath = path.join(filePath, "..");

  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

  return pino(
    pino.transport({
      target: "pino/file",
      options: {
        destination: filePath,
      },
    }),
  );
};
