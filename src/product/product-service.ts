import mongoose from "mongoose";
import { paginationLabels } from "../config/pagination";
import productModel, { Product } from "./product-model";
import { Filter, PaginateQuery } from "./product-types";

export class ProductService {
    private buildCategoryLookupStages() {
        return [
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
        ];
    }

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
        const [product] = await productModel
            .aggregate<Product>([
                {
                    $match: { _id: new mongoose.Types.ObjectId(productId) },
                },
                ...this.buildCategoryLookupStages(),
            ])
            .exec();

        return product ?? null;
    }

    async deleteProduct(productId: string) {
        return await productModel.findByIdAndDelete(productId);
    }

    async getProducts(
        q: string | undefined,
        filters: Filter,
        paginateQuery: PaginateQuery,
    ) {
        const matchQuery: Record<string, unknown> = {
            ...filters,
        };

        if (q && q.trim()) {
            const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            matchQuery.name = new RegExp(escapedQ, "i");
        }

        const aggregate = productModel.aggregate<Product>([
            {
                $match: matchQuery,
            },
            ...this.buildCategoryLookupStages(),
        ]);

        return await productModel.aggregatePaginate(aggregate, {
            ...paginateQuery,
            customLabels: paginationLabels,
        });
    }
}
