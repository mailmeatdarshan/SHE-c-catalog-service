import request from "supertest";
import app from "../app";
import { CategoryService } from "./category-service";

jest.mock("../common/middlewares/authenticate", () =>
    jest.fn((req, res, next) => {
        req.auth = { sub: "1", role: "admin" };
        next();
    }),
);

jest.mock("../common/middlewares/canAccess", () => ({
    canAccess: () => jest.fn((req, res, next) => next()),
}));

jest.mock("../common/services/S3Storage", () => ({
    S3Storage: jest.fn().mockImplementation(() => ({
        upload: jest.fn(),
        delete: jest.fn(),
        getObjectUri: jest.fn(),
    })),
}));

describe("Category Endpoints", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const validCategoryData = {
        name: "Interior Wall Paints",
        description: "Premium emulsion paints for interior plaster and masonry",
        priceConfiguration: {
            volume: {
                priceType: "base",
                availableOptions: ["1L", "4L", "10L", "20L"],
            },
            finish: {
                priceType: "additional",
                availableOptions: ["Matte", "Satin", "High-Gloss"],
            },
        },
        attributes: [
            {
                name: "Drying Time",
                widgetType: "number_input",
                defaultValue: 4,
                unit: "hours",
            },
            {
                name: "Is Washable",
                widgetType: "switch",
                defaultValue: true,
            },
        ],
    };

    describe("POST /categories", () => {
        it("should return 400 if category name is missing", async () => {
            const response = await request(app)
                .post("/categories")
                .send({
                    priceConfiguration: {
                        size: {
                            priceType: "base",
                            availableOptions: ["1L", "4L", "10L"],
                        },
                    },
                    attributes: [],
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it("should return 400 if priceConfiguration is missing", async () => {
            const response = await request(app).post("/categories").send({
                name: "Interior Wall Paints",
                attributes: [],
            });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it("should return 400 if priceType is invalid", async () => {
            const response = await request(app)
                .post("/categories")
                .send({
                    name: "Solvent Thinners",
                    priceConfiguration: {
                        container: {
                            priceType: "invalid_type",
                            availableOptions: ["1L", "5L"],
                        },
                    },
                    attributes: [],
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it("should return 201 and category ID when valid data is provided", async () => {
            const mockCategoryId = "64b1f8f9e123456789abcdef";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(
                CategoryService.prototype,
                "create",
            ).mockResolvedValueOnce({
                _id: mockCategoryId,
                name: "Interior Wall Paints",
            } as any);

            const response = await request(app)
                .post("/categories")
                .send(validCategoryData);

            expect(response.statusCode).toBe(201);
            expect(response.body.id).toBe(mockCategoryId);
        });
    });

    describe("PUT /categories/:id", () => {
        it("should return 400 if category ID is not a valid MongoDB ObjectId", async () => {
            const response = await request(app)
                .put("/categories/invalid-id")
                .send(validCategoryData);

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(
                response.body.errors.some(
                    (err: { msg: string }) => err.msg === "Invalid category ID",
                ),
            ).toBe(true);
        });

        it("should return 404 if category to update is not found", async () => {
            const nonExistentId = "64b1f8f9e123456789abcdef";
            jest.spyOn(
                CategoryService.prototype,
                "update",
            ).mockResolvedValueOnce(null);

            const response = await request(app)
                .put(`/categories/${nonExistentId}`)
                .send(validCategoryData);

            expect(response.statusCode).toBe(404);
        });

        it("should return 200 and category ID when category is updated successfully", async () => {
            const categoryId = "64b1f8f9e123456789abcdef";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(
                CategoryService.prototype,
                "update",
            ).mockResolvedValueOnce({
                _id: categoryId,
                name: "Updated Interior Wall Paints",
            } as any);

            const response = await request(app)
                .put(`/categories/${categoryId}`)
                .send(validCategoryData);

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(categoryId);
        });
    });

    describe("GET /categories", () => {
        it("should return 200 and list of categories", async () => {
            const mockCategories = [
                { _id: "1", name: "Paints" },
                { _id: "2", name: "Thinners" },
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(
                CategoryService.prototype,
                "getAll",
            ).mockResolvedValueOnce(mockCategories as any);

            const response = await request(app).get("/categories");

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockCategories);
        });
    });

    describe("GET /categories/:id", () => {
        it("should return 404 if category is not found", async () => {
            const nonExistentId = "64b1f8f9e123456789abcdef";
            jest.spyOn(
                CategoryService.prototype,
                "getById",
            ).mockResolvedValueOnce(null);

            const response = await request(app).get(
                `/categories/${nonExistentId}`,
            );

            expect(response.statusCode).toBe(404);
        });

        it("should return 200 and category details when category exists", async () => {
            const categoryId = "64b1f8f9e123456789abcdef";
            const mockCategory = {
                _id: categoryId,
                name: "Solvent Thinners",
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(
                CategoryService.prototype,
                "getById",
            ).mockResolvedValueOnce(mockCategory as any);

            const response = await request(app).get(
                `/categories/${categoryId}`,
            );

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockCategory);
        });
    });

    describe("DELETE /categories/:id", () => {
        it("should return 404 if category to delete is not found", async () => {
            const nonExistentId = "64b1f8f9e123456789abcdef";
            jest.spyOn(
                CategoryService.prototype,
                "delete",
            ).mockResolvedValueOnce(null);

            const response = await request(app).delete(
                `/categories/${nonExistentId}`,
            );

            expect(response.statusCode).toBe(404);
        });

        it("should return 200 and category ID when category is deleted", async () => {
            const categoryId = "64b1f8f9e123456789abcdef";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(
                CategoryService.prototype,
                "delete",
            ).mockResolvedValueOnce({
                _id: categoryId,
            } as any);

            const response = await request(app).delete(
                `/categories/${categoryId}`,
            );

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(categoryId);
        });
    });
});
