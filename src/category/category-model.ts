import mongoose from "mongoose";

export interface PriceConfigItem {
    priceType: "base" | "additional";
    availableOptions: string[];
    min?: number;
    max?: number;
}

export interface PriceConfiguration {
    [key: string]: PriceConfigItem;
}

export interface Attribute {
    name: string;
    widgetType:
        | "switch"
        | "dropdown"
        | "text_input"
        | "number_input"
        | "radio_group"
        | "checkbox_group";
    defaultValue: string | number | boolean | string[];
    availableOptions?: string[];
    unit?: string; // e.g. "hours", "sq.ft/L", "°C", "g/L"
    min?: number;
    max?: number;
    isRequired?: boolean;
}

export interface Category {
    name: string;
    slug?: string;
    description?: string;
    parentCategory?: mongoose.Types.ObjectId | null;
    priceConfiguration: PriceConfiguration;
    attributes: Attribute[];
}

const priceConfigItemSchema = new mongoose.Schema<PriceConfigItem>(
    {
        priceType: {
            type: String,
            enum: ["base", "additional"],
            required: true,
        },
        availableOptions: {
            type: [String],
            required: true,
        },
        min: {
            type: Number,
        },
        max: {
            type: Number,
        },
    },
    { _id: false },
);

const attributeSchema = new mongoose.Schema<Attribute>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        widgetType: {
            type: String,
            enum: [
                "switch",
                "dropdown",
                "text_input",
                "number_input",
                "radio_group",
                "checkbox_group",
            ],
            required: true,
        },
        defaultValue: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        availableOptions: {
            type: [String],
            default: undefined,
        },
        unit: {
            type: String,
            trim: true,
        },
        min: {
            type: Number,
        },
        max: {
            type: Number,
        },
        isRequired: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false },
);

const categorySchema = new mongoose.Schema<Category>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        priceConfiguration: {
            type: Map,
            of: priceConfigItemSchema,
            required: true,
        },
        attributes: {
            type: [attributeSchema],
            default: [],
        },
    },
    { timestamps: true },
);

export default mongoose.model<Category>("Category", categorySchema);
