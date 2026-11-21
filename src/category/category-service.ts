import CategoryModel, { Category } from "./category-model";

export class CategoryService {
    async create(categoryData: Category) {
        const category = new CategoryModel(categoryData);
        return await category.save();
    }
}
