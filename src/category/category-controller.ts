import { NextFunction, Response } from "express";
import { validationResult } from "express-validator";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { CategoryService } from "./category-service";
import { CreateCategoryRequest } from "./category-types";

export class CategoryController {
    constructor(
        private categoryService: CategoryService,
        private logger: Logger,
    ) {}

    create = async (
        req: CreateCategoryRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const {
            name,
            priceConfiguration,
            attributes,
            description,
            parentCategory,
        } = req.body;

        this.logger.info(`Creating category: ${name}`);

        try {
            const category = await this.categoryService.create({
                name,
                priceConfiguration,
                attributes,
                description,
                parentCategory,
            });

            return res.status(201).json({ id: category._id });
        } catch (error: unknown) {
            if ((error as { code?: number })?.code === 11000) {
                return next(
                    createHttpError(
                        400,
                        "Category with this name already exists",
                    ),
                );
            }
            return next(error);
        }
    };
}
