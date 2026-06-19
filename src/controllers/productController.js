import slugify from "slugify";

import Product from "../models/Product.js";
import Category from "../models/Category.js";

import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

import cloudinary from "../config/cloudinary.js";

// ======================================
// Create Product
// ======================================
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    productType,
    categories,
    commonImages,

    // Simple product
    price,
    salePrice,
    stock,
    sku,
    weight,

    // Variable product
    attributes,
    variants,

    customization,

    featured,
    trending,
    bestSeller,

    seo,
    publishSchedule,
    tags,
    brand,
  } = req.body;

  // =========================
  // Required Validation
  // =========================
  if (!name?.trim()) {
    throw new AppError("Product name is required", 400);
  }

  if (!description?.trim()) {
    throw new AppError("Description is required", 400);
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new AppError("At least one category is required", 400);
  }

  // =========================
  // Category Validation
  // =========================
  const existingCategories = await Category.find({
    _id: {
      $in: categories,
    },
  });

  if (existingCategories.length !== categories.length) {
    throw new AppError("Invalid categories selected", 400);
  }

  // =========================
  // Duplicate Slug Check
  // =========================
  const slug = slugify(name, {
    lower: true,
    strict: true,
  });

  const existingProduct = await Product.findOne({
    slug,
  });

  if (existingProduct) {
    throw new AppError("Product already exists", 400);
  }

  // =========================
  // Product Type Validation
  // =========================
  if (productType === "simple") {
    if (price === undefined || stock === undefined || !sku) {
      throw new AppError("Simple product needs price, stock and sku", 400);
    }
  }

  if (productType === "variable") {
    if (!attributes?.length) {
      throw new AppError("Attributes required for variable product", 400);
    }

    if (!variants?.length) {
      throw new AppError("Variants required for variable product", 400);
    }

    // Validate variants
    variants.forEach((variant) => {
      if (!variant.sku) {
        throw new AppError("Variant SKU is required", 400);
      }

      if (variant.price === undefined) {
        throw new AppError("Variant price required", 400);
      }

      if (variant.stock === undefined) {
        throw new AppError("Variant stock required", 400);
      }
    });
  }

  // =========================
  // Customization Validation
  // =========================
  if (customization?.enabled) {
    if (customization.allowText) {
      if (!customization.maxCharacters) {
        throw new AppError("Max characters required", 400);
      }
    }

    if (customization.allowImage) {
      if (customization.maxImages === undefined) {
        throw new AppError("Max images required", 400);
      }

      if (customization.minImages > customization.maxImages) {
        throw new AppError("Min images cannot exceed max images", 400);
      }
    }
  }

  if (!commonImages?.length) {
    throw new AppError("At least one product image is required", 400);
  }

  // =========================
  // Create Product
  // =========================
  const product = await Product.create({
    name: name.trim(),

    slug,

    description,

    shortDescription,

    commonImages,

    productType: productType || "simple",

    categories,

    brand,

    tags,

    // Simple product
    price,
    salePrice,
    stock,
    sku,
    weight,

    // Variable
    attributes,
    variants,

    customization,

    featured: featured || false,

    trending: trending || false,

    bestSeller: bestSeller || false,

    seo,

    publishSchedule,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

// ======================================
// Get Products
// ======================================
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    minPrice,
    maxPrice,
    sort = "newest",
  } = req.query;

  const query = {
    softDelete: false,
    status: true,
  };

  // Search
  if (search) {
    query.$text = {
      $search: search,
    };
  }

  // Category filter
  // Category filter by slug
  if (category) {
    const categoryDoc = await Category.findOne({
      slug: category,
      softDelete: false,
      status: true,
    });

    if (categoryDoc) {
      query.categories = {
        $in: [categoryDoc._id],
      };
    } else {
      query.categories = {
        $in: [],
      };
    }
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};

    if (minPrice) {
      query.price.$gte = Number(minPrice);
    }

    if (maxPrice) {
      query.price.$lte = Number(maxPrice);
    }
  }

  // Sort
  let sortBy = {
    createdAt: -1,
  };

  switch (sort) {
    case "price-low-high":
      sortBy = {
        price: 1,
      };
      break;

    case "price-high-low":
      sortBy = {
        price: -1,
      };
      break;

    case "best-selling":
      sortBy = {
        totalSold: -1,
      };
      break;

    case "top-rated":
      sortBy = {
        averageRating: -1,
      };
      break;
  }

  const skip = (page - 1) * limit;

  const products = await Product.find(query)
    .populate("categories", "name slug")
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,

    total,

    currentPage: Number(page),

    totalPages: Math.ceil(total / limit),

    products,
  });
});

// ======================================
// Get Single Product
// ======================================
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    softDelete: false,
    status: true,
  }).populate("categories", "name slug");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Related products
  const relatedProducts = await Product.find({
    _id: {
      $ne: product._id,
    },

    categories: {
      $in: product.categories.map((cat) => cat._id),
    },

    softDelete: false,
  })
    .limit(8)
    .select("name slug commonImages price salePrice");

  res.status(200).json({
    success: true,
    product,
    relatedProducts,
  });
});

// ======================================
// Featured Products
// ======================================
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    featured: true,
    softDelete: false,
    status: true,
  })
    .limit(12)
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    products,
  });
});

// ======================================
// Trending Products
// ======================================
export const getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    trending: true,
    softDelete: false,
    status: true,
  })
    .limit(12)
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    products,
  });
});

// ======================================
// Best Seller Products
// ======================================
export const getBestSellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    bestSeller: true,
    softDelete: false,
    status: true,
  })
    .limit(12)
    .sort({
      totalSold: -1,
    });

  res.status(200).json({
    success: true,
    products,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const updateData = {
    ...req.body,
  };

  // Update slug if name changes
  if (req.body.name) {
    updateData.slug = slugify(req.body.name, {
      lower: true,
      strict: true,
    });
  }

  // Validate categories
  if (req.body.categories) {
    const categories = await Category.find({
      _id: {
        $in: req.body.categories,
      },
    });

    if (categories.length !== req.body.categories.length) {
      throw new AppError("Invalid categories", 400);
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Soft delete
  product.softDelete = true;

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    throw new AppError("No images uploaded", 400);
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "urs-gift-club/products",

      resource_type: "image",

      quality: "auto",

      fetch_format: "auto",
    });

    uploadedImages.push({
      url: result.secure_url,

      public_id: result.public_id,
    });
  }

  res.status(200).json({
    success: true,
    images: uploadedImages,
  });
});

export const uploadCustomizationImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    throw new AppError("No images uploaded", 400);
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "urs-gift-club/customizations",

      resource_type: "image",

      quality: "auto",

      fetch_format: "auto",
    });

    uploadedImages.push({
      url: result.secure_url,

      public_id: result.public_id,
    });
  }

  res.status(200).json({
    success: true,
    images: uploadedImages,
  });
});

export const deleteCustomizationImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    throw new AppError("Public id required", 400);
  }

  await cloudinary.uploader.destroy(decodeURIComponent(publicId));

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});
