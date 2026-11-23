import { NextFunction, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Logger } from "winston";
import { UploadedFile } from "express-fileupload";
import { ProductService } from "./product-service";
import {
    CreateProductRequest,
    Product,
    ProductPriceConfiguration,
    AttributeValue,
} from "./product-types";

export class ProductController {
    constructor(
        private productService: ProductService,
        private logger?: Logger,
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

        const image = req.files?.image as UploadedFile | undefined;
        // todo: image upload to storage (e.g. S3 / Cloudinary)
        const imageName = image?.name ?? "image.jpg";

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
