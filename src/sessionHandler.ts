import path from "path";
import pino, { Logger } from "pino";
import { PseudoTtyInfo, Session } from "ssh2";
import api from "./api";

const ptyHandler = (session: Session, info: PseudoTtyInfo, logger: Logger) => {
  logger.info("pty create");
  // window-change
  // shell
};

export default (session: Session, userId: number, logger: Logger) => {
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

    if (commandName == "api")
      try {
        api.inputRaw(info.command, {}, accept());
      } catch (error) {
        logger.error(error);
      }

    reject();
  });

  session.on("sftp", (accept, reject) => {
    reject();
  });
};
