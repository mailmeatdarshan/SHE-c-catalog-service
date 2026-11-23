import express, { NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";
import { asyncWrapper } from "../common/utils/asyncWrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";
import { ProductController } from "./product-controller";
import productValidator from "./product-validator";
import { ProductService } from "./product-service";
import logger from "../config/logger";
import { CreateProductRequest } from "./product-types";

const router = express.Router();

const productService = new ProductService();
const productController = new ProductController(productService, logger);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload({
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        abortOnLimit: true,
    }),
    productValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        productController.create(req as CreateProductRequest, res, next),
    ),
);

export default router;
