import { ServerChannel } from "ssh2";
import ErrorResponse, { ResponseCode } from "../ErrorResponse";

export const checkPositiveNumber = (x: any) =>
  Number.isSafeInteger(x) && x >= 0;

export const validatePositiveNumber = (
  name: string,
  x: any,
  stream: ServerChannel,
) => {
  if (checkPositiveNumber(x)) return true;

  const res = new ErrorResponse(ResponseCode.BadRequest, {
    message: name + " must positive number",
    data: null,
  });
  stream.write(res.toString());
  stream.exit(res.code);
  stream.end();

  return false;
};
