import express, { NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";
import createHttpError from "http-errors";
import { asyncWrapper } from "../common/utils/asyncWrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";
import { S3Storage } from "../common/services/S3Storage";
import logger from "../config/logger";
import { ProductController } from "./product-controller";
import { ProductService } from "./product-service";
import { CreateProductRequest } from "./product-types";
import createProductValidator from "./create-product-validator";
import updateProductValidator, {
    productIdValidator,
} from "./update-product-validator";

const router = express.Router();

const productService = new ProductService();
const s3Storage = new S3Storage();
const productController = new ProductController(
    productService,
    logger,
    s3Storage,
);

const uploadMiddleware = fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    abortOnLimit: true,
    limitHandler: (_req, _res, next) => {
        next(createHttpError(400, "File size must be less than 5MB"));
    },
});

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    uploadMiddleware,
    createProductValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        productController.create(req as CreateProductRequest, res, next),
    ),
);

router.put(
    "/:productId",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    uploadMiddleware,
    updateProductValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        productController.update(req as CreateProductRequest, res, next),
    ),
);

router.get(
    "/",
    asyncWrapper((req: Request, res: Response) =>
        productController.index(req, res),
    ),
);

router.get(
    "/:productId",
    productIdValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        productController.getById(req, res, next),
    ),
);

router.delete(
    "/:productId",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    productIdValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        productController.delete(req, res, next),
    ),
);

export default router;
