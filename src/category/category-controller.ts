import { NextFunction, Request, Response } from "express";
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

    update = async (
        req: CreateCategoryRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { id } = req.params;
        const {
            name,
            priceConfiguration,
            attributes,
            description,
            parentCategory,
        } = req.body;

        this.logger.info(`Updating category: ${id}`);

        try {
            const category = await this.categoryService.update(id, {
                name,
                priceConfiguration,
                attributes,
                description,
                parentCategory,
            });

            if (!category) {
                return next(createHttpError(404, "Category not found"));
            }

            return res.json({ id: category._id });
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

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        this.logger.info("Fetching all categories");
        try {
            const categories = await this.categoryService.getAll();
            return res.json(categories);
        } catch (error) {
            return next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        this.logger.info(`Fetching category by id: ${id}`);
        try {
            const category = await this.categoryService.getById(id);
            if (!category) {
                return next(createHttpError(404, "Category not found"));
            }
            return res.json(category);
        } catch (error) {
            return next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        this.logger.info(`Deleting category: ${id}`);
        try {
            const category = await this.categoryService.delete(id);
            if (!category) {
                return next(createHttpError(404, "Category not found"));
            }
            return res.json({ id: category._id });
        } catch (error) {
            return next(error);
        }
    };
}
