import { Request } from "express";
import { Attribute, PriceConfiguration } from "./category-model";

export interface CreateCategoryRequest extends Request {
    body: {
        name: string;
        priceConfiguration: PriceConfiguration;
        attributes: Attribute[];
        description?: string;
        parentCategory?: string | null;
    };
}
