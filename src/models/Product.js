import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    values: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    combination: {
      type: Map,
      of: String,
      required: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      default: null,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    mainImageIndex: {
      type: Number,
      default: 0,
      min: 0,
    },

    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    description: {
      type: String,
      required: true,
    },

    productType: {
      type: String,
      enum: ["simple", "variable"],
      default: "simple",
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    tags: [String],

    commonImages: [imageSchema],

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    salePrice: {
      type: Number,
      default: null,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    attributes: [attributeSchema],

    variants: [variantSchema],

    customization: {
      enabled: {
        type: Boolean,
        default: false,
      },

      allowText: {
        type: Boolean,
        default: false,
      },

      allowImage: {
        type: Boolean,
        default: false,
      },

      minImages: {
        type: Number,
        default: 0,
      },

      maxImages: {
        type: Number,
        default: 0,
      },

      maxCharacters: {
        type: Number,
        default: 0,
      },

      allowedFonts: [String],
    },

    shipping: {
      weight: {
        type: Number,
        default: 0,
      },
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    publishSchedule: {
      publishAt: {
        type: Date,
        default: Date.now,
      },

      unpublishAt: {
        type: Date,
        default: null,
      },
    },

    featured: {
      type: Boolean,
      default: false,
    },

    trending: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    totalSold: {
      type: Number,
      default: 0,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    status: {
      type: Boolean,
      default: true,
    },

    softDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
productSchema.index({
  name: "text",
  shortDescription: "text",
  tags: "text",
});

const Product = mongoose.model("Product", productSchema);

export default Product;
