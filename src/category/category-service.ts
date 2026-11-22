import CategoryModel, { Category } from "./category-model";

export class CategoryService {
    async create(categoryData: Category) {
        const category = new CategoryModel(categoryData);
        return await category.save();
    }

    async update(categoryId: string, categoryData: Partial<Category>) {
        return await CategoryModel.findByIdAndUpdate(
            categoryId,
            {
                $set: categoryData,
            },
            { new: true, runValidators: true },
        );
    }

    async getAll() {
        return await CategoryModel.find();
    }

    async getById(categoryId: string) {
        return await CategoryModel.findById(categoryId);
    }

    async delete(categoryId: string) {
        return await CategoryModel.findByIdAndDelete(categoryId);
    }
}
