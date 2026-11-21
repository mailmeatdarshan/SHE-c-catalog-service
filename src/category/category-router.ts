import express, { NextFunction, Request, Response } from "express";
import { CategoryController } from "./category-controller";
import categoryValidator from "./category-validator";
import { CategoryService } from "./category-service";
import logger from "../config/logger";
import { CreateCategoryRequest } from "./category-types";

const router = express.Router();

const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService, logger);

router.post(
    "/",
    categoryValidator,
    (req: Request, res: Response, next: NextFunction) => {
        void categoryController.create(req as CreateCategoryRequest, res, next);
    },
);

export default router;
