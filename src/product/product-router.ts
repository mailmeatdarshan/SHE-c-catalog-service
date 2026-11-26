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
import { S3Storage } from "../common/services/S3Storage";
import createHttpError from "http-errors";

const router = express.Router();

const productService = new ProductService();
const s3Storage = new S3Storage();
const productController = new ProductController(
    productService,
    logger,
    s3Storage,
);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload({
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        abortOnLimit: true,
        limitHandler: (_req, _res, next) => {
            const error = createHttpError(
                400,
                "File size must be less than 5MB",
            );
            next(error);
        },
    }),
    productValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        productController.create(req as CreateProductRequest, res, next),
    ),
);

export default router;
