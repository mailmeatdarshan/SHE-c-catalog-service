import { body } from "express-validator";
import { baseProductValidator } from "./update-product-validator";

const createProductValidator = [
    ...baseProductValidator,

    body("image").custom((value: unknown, { req }) => {
        const files = (req as { files?: Record<string, unknown> }).files;
        if (!files || !files.image) {
            throw new Error("Product image is required");
        }
        return true;
    }),
];

export default createProductValidator;
