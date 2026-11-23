import productModel, { Product } from "./product-model";

export class ProductService {
    async createProduct(product: Product) {
        return await productModel.create(product);
    }
}
