import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";

export class ProductController {
    async create(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }
    }
}
