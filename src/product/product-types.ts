import { Request } from "express";
import {
    Product,
    ProductPriceConfiguration,
    AttributeValue,
} from "./product-model";
import mongoose from "mongoose";

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

export interface Filter {
    categoryId?: mongoose.Types.ObjectId;
    isPublish?: boolean;
}

export type { Product, ProductPriceConfiguration, AttributeValue };
