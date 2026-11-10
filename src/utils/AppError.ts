type ValidationIssue = {
  field: string;
  message: string;
};

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errors?: ValidationIssue[];

  constructor(
    message: string,
    statusCode: number,
    errors?: ValidationIssue[],
  ) {
    super(message);

    this.statusCode = statusCode;

    this.status = `${statusCode}`.startsWith("4")
      ? "fail"
      : "error";

    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}