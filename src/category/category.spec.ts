import request from "supertest";
import app from "../app";
import { CategoryService } from "./category-service";

describe("POST /categories", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Validation checks", () => {
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
            expect(
                response.body.errors.some(
                    (err: { msg: string }) =>
                        err.msg === "Category name is required" ||
                        err.msg === "Category name cannot be empty",
                ),
            ).toBe(true);
        });

        it("should return 400 if priceConfiguration is missing", async () => {
            const response = await request(app).post("/categories").send({
                name: "Interior Wall Paints",
                attributes: [],
            });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
            expect(
                response.body.errors.some(
                    (err: { msg: string }) =>
                        err.msg === "Price configuration is required",
                ),
            ).toBe(true);
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

        it("should return 400 if attributes field is missing", async () => {
            const response = await request(app)
                .post("/categories")
                .send({
                    name: "Reactive Dyes",
                    priceConfiguration: {
                        weight: {
                            priceType: "base",
                            availableOptions: ["100g", "1kg", "25kg"],
                        },
                    },
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe("Successful creation", () => {
        it("should return 201 and category ID when valid paint category data is provided", async () => {
            const mockCategoryId = "64b1f8f9e123456789abcdef";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(
                CategoryService.prototype,
                "create",
            ).mockResolvedValueOnce({
                _id: mockCategoryId,
                name: "Interior Wall Paints",
            } as any);

            const categoryData = {
                name: "Interior Wall Paints",
                description:
                    "Premium emulsion paints for interior plaster and masonry",
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
                    {
                        name: "Substrate",
                        widgetType: "checkbox_group",
                        defaultValue: ["Plaster", "Concrete"],
                        availableOptions: ["Plaster", "Concrete", "Gypsum"],
                    },
                ],
            };

            const response = await request(app)
                .post("/categories")
                .send(categoryData);

            expect(response.statusCode).toBe(201);
            expect(response.body.id).toBe(mockCategoryId);
        });
    });
});
