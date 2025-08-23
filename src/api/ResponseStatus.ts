export enum StatusCode {
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

