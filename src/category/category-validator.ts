import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("Category name is required")
        .isString()
        .withMessage("Category name must be a string")
        .trim()
        .notEmpty()
        .withMessage("Category name cannot be empty"),

    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a string"),

    body("priceConfiguration")
        .exists()
        .withMessage("Price configuration is required")
        .isObject()
        .withMessage("Price configuration must be an object")
        .custom((value: Record<string, unknown>) => {
            if (Object.keys(value).length === 0) {
                throw new Error("Price configuration cannot be empty");
            }
            return true;
        }),

    body("priceConfiguration.*.priceType")
        .exists()
        .withMessage("Price type is required")
        .isString()
        .withMessage("Price type must be a string")
        .custom((value: string) => {
            const validKeys = ["base", "additional"];
            if (!validKeys.includes(value)) {
                throw new Error(
                    `${value} is invalid attribute for priceType field. Possible values: [${validKeys.join(
                        ", ",
                    )}]`,
                );
            }
            return true;
        }),

    body("priceConfiguration.*.availableOptions")
        .exists()
        .withMessage("availableOptions is required")
        .isArray({ min: 1 })
        .withMessage("availableOptions must be a non-empty array"),

    body("attributes")
        .exists()
        .withMessage("Attributes are required")
        .isArray()
        .withMessage("Attributes must be an array"),

    body("attributes.*.name")
        .exists()
        .withMessage("Attribute name is required")
        .isString()
        .withMessage("Attribute name must be a string"),

    body("attributes.*.widgetType")
        .exists()
        .withMessage("Attribute widgetType is required")
        .isIn([
            "switch",
            "dropdown",
            "text_input",
            "number_input",
            "radio_group",
            "checkbox_group",
        ])
        .withMessage(
            "Invalid widgetType. Possible values: [switch, dropdown, text_input, number_input, radio_group, checkbox_group]",
        ),

    body("attributes.*.defaultValue")
        .exists()
        .withMessage("Attribute defaultValue is required"),

    body("attributes.*.availableOptions")
        .optional()
        .isArray()
        .withMessage("availableOptions must be an array"),
];
