import { Response } from "express";

export const ok = (
  res: Response,
  result: unknown,
  message = "OK",
  status = 200
) => {
  res.status(status).json({ isSuccess: true, message, result });
};

export const created = (
  res: Response,
  result: unknown,
  message = "Created"
) => ok(res, result, message, 201);

export const fail = (
  res: Response,
  message: string,
  status = 400,
  result?: unknown
) => {
  res.status(status).json({ isSuccess: false, message, result });
};
