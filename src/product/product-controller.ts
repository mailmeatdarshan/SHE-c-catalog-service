import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "winston";
import { UploadedFile } from "express-fileupload";
import { ProductService } from "./product-service";
import {
    CreateProductRequest,
    CreateProductRequestBody,
    Product,
    ProductPriceConfiguration,
    AttributeValue,
    Filter,
} from "./product-types";
import { FileStorage } from "../common/types/storage";

export class ProductController {
    constructor(
        private productService: ProductService,
        private logger: Logger,
        private storage: FileStorage,
    ) {}

    private buildProductPayload(
        body: CreateProductRequestBody,
        image: string,
    ): Product {
        const {
            name,
            description,
            priceConfiguration,
            attributes,
            categoryId,
            isPublish,
        } = body;

        const parsedPriceConfiguration =
            typeof priceConfiguration === "string"
                ? (JSON.parse(priceConfiguration) as ProductPriceConfiguration)
                : priceConfiguration;

        const parsedAttributes =
            typeof attributes === "string"
                ? (JSON.parse(attributes) as AttributeValue[])
                : attributes;

        const shouldPublish =
            typeof isPublish === "string"
                ? isPublish === "true"
                : Boolean(isPublish);

        return {
            name,
            description,
            priceConfiguration: parsedPriceConfiguration,
            attributes: parsedAttributes,
            categoryId,
            isPublish: shouldPublish,
            image,
        };
    }

    private async safeDeleteImage(filename: string, context: string) {
        try {
            await this.storage.delete(filename);
        } catch (deleteError) {
            this.logger?.error(`Failed to delete S3 image (${context})`, {
                filename,
                error: deleteError,
            });
        }
    }

    create = async (
        req: CreateProductRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        this.logger?.info(`Creating product: ${req.body.name}`);

        const image = req.files?.image as UploadedFile;
        const imageName = uuidv4();

        await this.storage.upload({
            filename: imageName,
            fileData: image.data,
        });

        const product = this.buildProductPayload(req.body, imageName);

        try {
            const newProduct = await this.productService.createProduct(product);
            return res.status(201).json({ id: newProduct._id });
        } catch (error: unknown) {
            await this.safeDeleteImage(imageName, "create rollback");

            if ((error as { code?: number })?.code === 11000) {
                return next(
                    createHttpError(
                        400,
                        "Product with this name already exists",
                    ),
                );
            }
            return next(error);
        }
    };

    update = async (
        req: CreateProductRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { productId } = req.params;
        this.logger?.info(`Updating product: ${productId}`);

        const oldImage = await this.productService.getProductImage(productId);
        if (!oldImage) {
            return next(createHttpError(404, "Product not found"));
        }

        let newImageName: string | undefined;
        if (req.files?.image) {
            const image = req.files.image as UploadedFile;
            newImageName = uuidv4();

            await this.storage.upload({
                filename: newImageName,
                fileData: image.data,
            });
        }

        const product = this.buildProductPayload(
            req.body,
            newImageName ?? oldImage,
        );

        try {
            const updatedProduct = await this.productService.updateProduct(
                productId,
                product,
            );

            if (!updatedProduct) {
                if (newImageName) {
                    await this.safeDeleteImage(
                        newImageName,
                        "update 404 rollback",
                    );
                }
                return next(createHttpError(404, "Product not found"));
            }

            if (newImageName) {
                await this.safeDeleteImage(oldImage, "old image cleanup");
            }

            return res.json({ id: updatedProduct._id });
        } catch (error: unknown) {
            if (newImageName) {
                await this.safeDeleteImage(
                    newImageName,
                    "update error rollback",
                );
            }

            if ((error as { code?: number })?.code === 11000) {
                return next(
                    createHttpError(
                        400,
                        "Product with this name already exists",
                    ),
                );
            }
            return next(error);
        }
    };

    index = async (req: Request, res: Response) => {
        const { q, categoryId, isPublish } = req.query;

        const filters: Filter = {};

        if (isPublish === "true") {
            filters.isPublish = true;
        }

        if (
            categoryId &&
            mongoose.Types.ObjectId.isValid(categoryId as string)
        ) {
            filters.categoryId = new mongoose.Types.ObjectId(
                categoryId as string,
            );
        }

        this.logger?.info("Fetching products", { q, filters });

        const parsedPage = parseInt(req.query.page as string, 10);
        const parsedLimit = parseInt(req.query.limit as string, 10);
        const page =
            !Number.isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const limit =
            !Number.isNaN(parsedLimit) && parsedLimit > 0
                ? Math.min(parsedLimit, 100)
                : 10;

        const products = await this.productService.getProducts(
            q as string | undefined,
            filters,
            {
                page,
                limit,
            },
        );

        const finalProducts = (products.data as Product[]).map((product) => ({
            ...product,
            image: this.storage.getObjectUri(product.image),
        }));

        return res.json({
            data: finalProducts,
            total: products.total,
            pageSize: products.pageSize,
            currentPage: products.currentPage,
        });
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { productId } = req.params;
        this.logger?.info(`Fetching product: ${productId}`);

        const product = await this.productService.getProduct(productId);
        if (!product) {
            return next(createHttpError(404, "Product not found"));
        }

        return res.json({
            ...product,
            image: this.storage.getObjectUri(product.image),
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { productId } = req.params;
        this.logger?.info(`Deleting product: ${productId}`);

        const deletedProduct =
            await this.productService.deleteProduct(productId);
        if (!deletedProduct) {
            return next(createHttpError(404, "Product not found"));
        }

        await this.safeDeleteImage(deletedProduct.image, "product delete");

        return res.json({ id: deletedProduct._id });
    };
}
