import mongoose, { AggregatePaginateModel } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface AttributeValue {
    name: string;
    value: string | number | boolean | string[];
}

export interface ProductPriceConfigItem {
    priceType: "base" | "additional";
    availableOptions: Map<string, number> | Record<string, number>;
}

export interface ProductPriceConfiguration {
    [key: string]: ProductPriceConfigItem;
}

export interface Product {
    name: string;
    description: string;
    image: string;
    priceConfiguration: ProductPriceConfiguration;
    attributes: AttributeValue[];
    categoryId: mongoose.Types.ObjectId | string;
    isPublish?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const attributeValueSchema = new mongoose.Schema<AttributeValue>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    { _id: false },
);

const priceConfigurationSchema = new mongoose.Schema<ProductPriceConfigItem>(
    {
        priceType: {
            type: String,
            enum: ["base", "additional"],
            required: true,
        },
        availableOptions: {
            type: Map,
            of: Number,
            required: true,
        },
    },
    { _id: false },
);

const productSchema = new mongoose.Schema<Product>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        priceConfiguration: {
            type: Map,
            of: priceConfigurationSchema,
            required: true,
        },
        attributes: {
            type: [attributeValueSchema],
            default: [],
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },
        isPublish: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

productSchema.plugin(aggregatePaginate);

export default mongoose.model<Product, AggregatePaginateModel<Product>>(
    "Product",
    productSchema,
);
