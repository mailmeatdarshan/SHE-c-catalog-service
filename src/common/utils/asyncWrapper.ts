import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncWrapper = (
    requestHandler: (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => Promise<unknown> | void,
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            next(err),
        );
    };
};
