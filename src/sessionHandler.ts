import { Logger } from "pino";
import { PseudoTtyInfo, Session } from "ssh2";
import { Router } from "./scapi";

const ptyHandler = (session: Session, info: PseudoTtyInfo, logger: Logger) => {
  logger.info("pty create");
  // window-change
  // shell
};

export default (
  session: Session,
  api: Router,
  userId: number,
  logger: Logger,
) => {
  logger.info("session create");

  // TODO: Add interactive session later
  // session.on("pty", (accept, _reject, info) => {
  //   accept();
  //   try {
  //     ptyHandler(session, info, logger);
  //   } catch (e) {
  //     logger.info(e);
  //   }
  // });

  session.on("exec", (accept, reject, info) => {
    logger.info("session exec");

    const commandName = info.command.split(" ", 1)[0];

    if (commandName == "api") {
      const stream = accept();
      try {
        api.inputRaw(info.command, { userId }, stream);
      } catch (error) {
        logger.error(error);
        if (typeof error == "string" || error instanceof Error) {
          stream.write(error.toString());
        }
        stream.exit(1);
        stream.end();
      }
    } else reject();
  });

  session.on("sftp", (accept, reject) => {
    reject();
  });
};
