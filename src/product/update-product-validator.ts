import { body, param } from "express-validator";

export const baseProductValidator = [
    body("name")
        .exists()
        .withMessage("Product name is required")
        .isString()
        .withMessage("Product name must be a string")
        .trim()
        .notEmpty()
        .withMessage("Product name cannot be empty"),

    body("description")
        .exists()
        .withMessage("Description is required")
        .isString()
        .withMessage("Description must be a string")
        .trim()
        .notEmpty()
        .withMessage("Description cannot be empty"),

    body("priceConfiguration")
        .exists()
        .withMessage("Price configuration is required")
        .custom((value: unknown) => {
            let parsed = value;
            if (typeof value === "string") {
                try {
                    parsed = JSON.parse(value);
                } catch {
                    throw new Error(
                        "Price configuration must be a valid JSON object",
                    );
                }
            }
            if (
                typeof parsed !== "object" ||
                parsed === null ||
                Array.isArray(parsed)
            ) {
                throw new Error("Price configuration must be an object");
            }
            if (Object.keys(parsed as Record<string, unknown>).length === 0) {
                throw new Error("Price configuration cannot be empty");
            }
            return true;
        }),

    body("attributes")
        .exists()
        .withMessage("Attributes are required")
        .custom((value: unknown) => {
            let parsed = value;
            if (typeof value === "string") {
                try {
                    parsed = JSON.parse(value);
                } catch {
                    throw new Error("Attributes must be a valid JSON array");
                }
            }
            if (!Array.isArray(parsed)) {
                throw new Error("Attributes must be an array");
            }
            return true;
        }),

    body("categoryId")
        .exists()
        .withMessage("Category ID is required")
        .isMongoId()
        .withMessage("Category ID must be a valid Mongo ID"),
];

export const productIdValidator = [
    param("productId").isMongoId().withMessage("Invalid product ID"),
];

const updateProductValidator = [...productIdValidator, ...baseProductValidator];

export default updateProductValidator;
