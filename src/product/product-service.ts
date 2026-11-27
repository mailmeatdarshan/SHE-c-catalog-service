import productModel, { Product } from "./product-model";
import { Filter } from "./product-types";

export class ProductService {
    async createProduct(product: Product) {
        return await productModel.create(product);
    }

    async getProductImage(productId: string) {
        const product = await productModel.findById(productId);
        return product?.image;
    }

    async updateProduct(productId: string, product: Product) {
        return await productModel.findOneAndUpdate(
            { _id: productId },
            {
                $set: product,
            },
            {
                new: true,
            },
        );
    }

    async getProduct(productId: string): Promise<Product | null> {
        return await productModel.findOne({ _id: productId });
    }

    async getProducts(q: string | undefined, filters: Filter) {
        const matchQuery: Record<string, unknown> = {
            ...filters,
        };

        if (q && q.trim()) {
            const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            matchQuery.name = new RegExp(escapedQ, "i");
        }

        const aggregate = productModel.aggregate([
            {
                $match: matchQuery,
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                attributes: 1,
                                priceConfiguration: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            },
        ]);

        return (await aggregate.exec()) as Product[];
    }
}
