export enum ResponseCode {
  // CLIENT ERROR
  /** Server doesn't understand request, it should be modified */
  BadRequest = 140,
  /** Server requires auth info (useful if ssh auth is none, otherwise prefer pkey) */
  Unauthorized = 141,
  /** Client doesn't have access to resource (eg admin resources) */
  Forbidden = 143,
  /** Resource not found */
  NotFound = 144,
  /** Server didn't receive additional info from client (better not use it) */
  RequestTimeout = 148,
  /** Resource no longer exists (if it's moved use 137 or 138) */
  Gone = 410,
  /** Data is too large */
  RequestEntityTooLarge = 413,
  /** Use it how you want */
  ImATeapot = 418,
  /** Client sends too many requests (rate limit) */
  TooManyRequests = 429,
  /** See no reason you want this (added just in case) */
  UnavailableForLegalReasons = 451,

  // REDIRECTION
  /** Response have more than 1 variant, client should choose */
  MultipleChoices = 130,
  /** Response doesn't changed, client should use cached response */
  NotModified = 134,
  /** Resource path temporarily changed path */
  TemporaryRedirect = 137,
  /** Resource moved to new path */
  PermanentRedirect = 138,
}

export type ResponseData<T extends ResponseCode> = T extends
  | ResponseCode.BadRequest
  | ResponseCode.Unauthorized
  | ResponseCode.NotFound
  | ResponseCode.RequestTimeout
  | ResponseCode.Gone
  | ResponseCode.ImATeapot
  ? { message: string; data: any }
  : T extends ResponseCode.Forbidden
  ? { message: string; allowed: string[] }
  : T extends ResponseCode.RequestEntityTooLarge
  ? { message: string; maxSize: number }
  : T extends ResponseCode.TooManyRequests
  ? { message: string; allowedCount: number; timeoutExpire: number }
  : T extends ResponseCode.UnavailableForLegalReasons
  ? { message: string; allowed: string[]; rejected: string[] }
  : T extends ResponseCode.MultipleChoices
  ? { message: string; field: { name: string; values: string[] } }
  : T extends ResponseCode.NotModified
  ? { message: string; expires: number }
  : T extends
  | ResponseCode.TemporaryRedirect
  | ResponseCode.PermanentRedirect
  ? { message: string; path: string }
  : never;

export default class ErrorResponse<T extends ResponseCode> {
  code: T;
  data: ResponseData<T>;

  constructor(resCode: T, resData: ResponseData<T>) {
    this.code = resCode;
    this.data = resData;
  }

  toString(): string {
    return JSON.stringify(this.data);
  }
}
