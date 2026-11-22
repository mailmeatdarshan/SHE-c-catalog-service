import express, { NextFunction, Request, Response } from "express";
import { CategoryController } from "./category-controller";
import categoryValidator, {
    categoryUpdateValidator,
} from "./category-validator";
import { CategoryService } from "./category-service";
import logger from "../config/logger";
import { CreateCategoryRequest } from "./category-types";
import { asyncWrapper } from "../common/utils/asyncWrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";

const router = express.Router();

const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService, logger);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    categoryValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        categoryController.create(req as CreateCategoryRequest, res, next),
    ),
);

router.put(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    categoryUpdateValidator,
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        categoryController.update(req as CreateCategoryRequest, res, next),
    ),
);

router.get(
    "/",
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        categoryController.getAll(req, res, next),
    ),
);

router.get(
    "/:id",
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        categoryController.getById(req, res, next),
    ),
);

router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    asyncWrapper((req: Request, res: Response, next: NextFunction) =>
        categoryController.delete(req, res, next),
    ),
);

export default router;
