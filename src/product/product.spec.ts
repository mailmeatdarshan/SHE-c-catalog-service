import request from "supertest";
import app from "../app";
import { ProductService } from "./product-service";
import { S3Storage } from "../common/services/S3Storage";

jest.mock("../common/middlewares/authenticate", () =>
    jest.fn((req, res, next) => {
        req.auth = { sub: "1", role: "admin" };
        next();
    }),
);

jest.mock("../common/middlewares/canAccess", () => ({
    canAccess: () => jest.fn((req, res, next) => next()),
}));

jest.mock("../common/services/S3Storage", () => {
    const deleteMock = jest.fn();
    return {
        S3Storage: jest.fn().mockImplementation(() => ({
            upload: jest.fn(),
            delete: deleteMock,
            getObjectUri: jest.fn(
                (filename: string) =>
                    `https://test-bucket.s3.us-east-1.amazonaws.com/${filename}`,
            ),
        })),
    };
});

describe("Product Endpoints", () => {
    const mockS3Instance = (S3Storage as unknown as jest.Mock).mock.results[0]
        .value as { delete: jest.Mock };

    afterEach(() => {
        jest.restoreAllMocks();
        mockS3Instance.delete.mockClear();
    });

    describe("GET /products", () => {
        it("should return paginated products with mapped image URIs and correct pagination labels", async () => {
            const mockResult = {
                data: [
                    {
                        _id: "64b1f8f9e123456789abcdef",
                        name: "Interior Gloss Paint",
                        image: "img-uuid-1",
                    },
                ],
                total: 1,
                pageSize: 10,
                currentPage: 1,
            };

            jest.spyOn(
                ProductService.prototype,
                "getProducts",
            ).mockResolvedValueOnce(mockResult as never);

            const response = await request(app).get("/products");

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                data: [
                    {
                        _id: "64b1f8f9e123456789abcdef",
                        name: "Interior Gloss Paint",
                        image: "https://test-bucket.s3.us-east-1.amazonaws.com/img-uuid-1",
                    },
                ],
                total: 1,
                pageSize: 10,
                currentPage: 1,
            });
        });
    });

    describe("GET /products/:productId", () => {
        it("should return 400 if productId is not a valid MongoDB ObjectId", async () => {
            const response = await request(app).get("/products/invalid-id");

            expect(response.statusCode).toBe(400);
        });

        it("should return 404 if product is not found", async () => {
            const nonExistentId = "64b1f8f9e123456789abcdef";
            jest.spyOn(
                ProductService.prototype,
                "getProduct",
            ).mockResolvedValueOnce(null);

            const response = await request(app).get(
                `/products/${nonExistentId}`,
            );

            expect(response.statusCode).toBe(404);
        });

        it("should return 200 and product details with mapped image URI when product exists", async () => {
            const productId = "64b1f8f9e123456789abcdef";
            const mockProduct = {
                _id: productId,
                name: "Solvent Thinner",
                image: "img-uuid-2",
            };

            jest.spyOn(
                ProductService.prototype,
                "getProduct",
            ).mockResolvedValueOnce(mockProduct as never);

            const response = await request(app).get(`/products/${productId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                _id: productId,
                name: "Solvent Thinner",
                image: "https://test-bucket.s3.us-east-1.amazonaws.com/img-uuid-2",
            });
        });
    });

    describe("DELETE /products/:productId", () => {
        it("should return 400 if productId is not a valid MongoDB ObjectId", async () => {
            const response = await request(app).delete("/products/invalid-id");

            expect(response.statusCode).toBe(400);
        });

        it("should return 404 if product to delete is not found", async () => {
            const nonExistentId = "64b1f8f9e123456789abcdef";
            jest.spyOn(
                ProductService.prototype,
                "deleteProduct",
            ).mockResolvedValueOnce(null);

            const response = await request(app).delete(
                `/products/${nonExistentId}`,
            );

            expect(response.statusCode).toBe(404);
            expect(mockS3Instance.delete).not.toHaveBeenCalled();
        });

        it("should return 200, product ID, and delete S3 image when product is deleted", async () => {
            const productId = "64b1f8f9e123456789abcdef";
            jest.spyOn(
                ProductService.prototype,
                "deleteProduct",
            ).mockResolvedValueOnce({
                _id: productId,
                image: "img-uuid-3",
            } as never);

            const response = await request(app).delete(
                `/products/${productId}`,
            );

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ id: productId });
            expect(mockS3Instance.delete).toHaveBeenCalledWith("img-uuid-3");
        });
    });
});
