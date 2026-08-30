import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { AppError } from "./errors";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      next(new AppError(400, "validation_error", `${issue.path.join(".") || "body"}: ${issue.message}`));
      return;
    }
    req.body = result.data;
    next();
  };
}
