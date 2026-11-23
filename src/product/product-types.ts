import { Request } from "express";
import {
    Product,
    ProductPriceConfiguration,
    AttributeValue,
} from "./product-model";

export interface CreateProductRequestBody {
    name: string;
    description: string;
    priceConfiguration: string | ProductPriceConfiguration;
    attributes: string | AttributeValue[];
    categoryId: string;
    isPublish?: boolean | string;
    image?: string;
}

export interface CreateProductRequest extends Request {
    body: CreateProductRequestBody;
}

export type { Product, ProductPriceConfiguration, AttributeValue };
