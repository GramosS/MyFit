// Fel för förutsägbara HTTP-svar (4xx/5xx).
// errorHandler använder statusCode och skickar rätt svar till klienten.
export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}
