import { NextFunction, Request, Response } from "express";
import { HttpError } from "./ownership";
import { fail } from "./response";

export const handleRouteError = (
  error: unknown,
  res: Response,
  fallback = "Server error"
) => {
  if (error instanceof HttpError) {
    fail(res, error.message, error.status);
    return;
  }
  console.error(error);
  fail(res, fallback, 500);
};

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  handleRouteError(err, res);
};
