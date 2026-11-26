import { NextFunction, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "winston";
import { UploadedFile } from "express-fileupload";
import { ProductService } from "./product-service";
import {
    CreateProductRequest,
    Product,
    ProductPriceConfiguration,
    AttributeValue,
} from "./product-types";
import { FileStorage } from "../common/types/storage";

export class ProductController {
    constructor(
        private productService: ProductService,
        private logger: Logger,
        private storage: FileStorage,
    ) {}

    create = async (
        req: CreateProductRequest,
        res: Response,
        next: NextFunction,
    ) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const {
            name,
            description,
            priceConfiguration,
            attributes,
            categoryId,
            isPublish,
        } = req.body;

        this.logger?.info(`Creating product: ${name}`);

        const image = req.files?.image as UploadedFile;

        const imageName = uuidv4();

        await this.storage.upload({
            filename: imageName,
            fileData: image.data,
        });

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

        const product: Product = {
            name,
            description,
            priceConfiguration: parsedPriceConfiguration,
            attributes: parsedAttributes,
            categoryId,
            isPublish: shouldPublish,
            image: imageName,
        };

        try {
            const newProduct = await this.productService.createProduct(product);
            return res.status(201).json({ id: newProduct._id });
        } catch (error: unknown) {
            try {
                await this.storage.delete(imageName);
            } catch (deleteError) {
                this.logger?.error("Failed to delete orphaned S3 image", {
                    imageName,
                    error: deleteError,
                });
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
}
