import { Logger } from "pino";
import { PseudoTtyInfo, Session } from "ssh2";

const ptyHandler = (session: Session, info: PseudoTtyInfo, logger: Logger) => {
  logger.info("pty create");
  // window-change
  // shell
};

export default (session: Session, logger: Logger) => {
  logger.info("session create");

  session.on("pty", (accept, _reject, info) => {
    accept();
    try {
      ptyHandler(session, info, logger);
    } catch (e) {
      logger.info(e);
    }
  });

  session.on("exec", (accept, reject, info) => {
    logger.info(info);
    reject();
  });

  session.on("sftp", (accept, reject) => {
    reject();
  });
};
