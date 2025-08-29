import { ServerChannel } from "ssh2";
import ErrorResponse, { ResponseCode } from "../ErrorResponse";

export const checkSelect = (select: any, whitelist: string[]): boolean => {
  if (typeof select != "object") return false;

  for (const key in select)
    if (
      !whitelist.includes(key) ||
      (typeof select[key] != "number" && typeof select[key] != "boolean")
    )
      return false;

  return true;
};

export const validateSelect = (
  select: any,
  whitelist: string[],
  stream: ServerChannel,
): boolean => {
  if (checkSelect(select, whitelist)) return true;

  const res = new ErrorResponse(ResponseCode.BadRequest, {
    message: "Bad Select: select is invalid",
    data: null,
  });

  stream.write(res.toString());
  stream.exit(res.code);
  stream.end();

  return false;
};

export const checkPositiveNumber = (x: any): boolean =>
  Number.isSafeInteger(x) && x >= 0;

export const validatePositiveNumber = (
  name: string,
  x: any,
  stream: ServerChannel,
): boolean => {
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
