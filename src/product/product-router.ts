import express, { NextFunction, Request, Response } from "express";
import { asyncWrapper } from "../common/utils/asyncWrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";
import { ProductController } from "./product-controller";
import productValidator from "./product-validator";

const router = express.Router();

const productController = new ProductController();

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    productValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        productController.create(req, res, next),
    ),
);

export default router;
