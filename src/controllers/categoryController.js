import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import slugify from "slugify";

// ======================================
// Create Category
// ======================================
export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, image, featured, order } = req.body;

  // Validation
  if (!name?.trim()) {
    throw new AppError("Category name is required", 400);
  }

  if (!slug?.trim()) {
    throw new AppError("Slug is required", 400);
  }

  // Duplicate check
  const existingCategory = await Category.findOne({
    $or: [
      {
        name: name.trim(),
      },
      {
        slug: slug.trim(),
      },
    ],
  });

  if (existingCategory) {
    throw new AppError("Category already exists", 400);
  }

  const category = await Category.create({
    name: name.trim(),

    slug: slug.trim(),

    description,

    image,

    featured: featured || false,

    order: order || 0,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",

    category,
  });
});

// ======================================
// Get All Categories
// ======================================
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({
    softDelete: false,
    status: true,
  }).sort({
    order: 1,
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

// ======================================
// Get Single Category
// ======================================
export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    softDelete: false,
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  res.status(200).json({
    success: true,
    category,
  });
});

// ======================================
// Update Category
// ======================================
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const { name, slug, description, image, featured, order, status } = req.body;

  // Duplicate check
  if (name || slug) {
    const existingCategory = await Category.findOne({
      _id: {
        $ne: category._id,
      },

      $or: [
        name
          ? {
              name: name.trim(),
            }
          : null,

        slug
          ? {
              slug: slug.trim(),
            }
          : null,
      ].filter(Boolean),
    });

    if (existingCategory) {
      throw new AppError("Category already exists", 400);
    }
  }

  if (name) category.name = name.trim();

  if (slug) category.slug = slug.trim();

  if (description !== undefined) {
    category.description = description;
  }

  if (image !== undefined) {
    category.image = image;
  }

  if (featured !== undefined) {
    category.featured = featured;
  }

  if (order !== undefined) {
    category.order = order;
  }

  if (status !== undefined) {
    category.status = status;
  }

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category updated successfully",

    category,
  });
});

// ======================================
// Delete Category
// ======================================
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Soft delete
  category.softDelete = true;

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
