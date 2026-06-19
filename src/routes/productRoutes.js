import express from "express";

import {
  createProduct,
  getProducts,
  getProduct,
  getFeaturedProducts,
  getTrendingProducts,
  getBestSellerProducts,
  deleteProduct,
  updateProduct,
  uploadProductImages,
  uploadCustomizationImages,
  deleteCustomizationImage,
} from "../controllers/productController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/featured", getFeaturedProducts);

router.get("/trending", getTrendingProducts);

router.get("/best-sellers", getBestSellerProducts);

router.get("/:slug", getProduct);

router.get("/", getProducts);

// Admin
router.post("/", protect, authorize("admin"), createProduct);

router.put("/:id", protect, authorize("admin"), updateProduct);

router.delete("/:id", protect, authorize("admin"), deleteProduct);

router.post(
  "/upload-images",

  protect,
  authorize("admin"),

  upload.array("images", 10),

  uploadProductImages,
);

// Customer customization upload
router.post(
  "/customization/upload",

  upload.array("images", 5),

  uploadCustomizationImages,
);

// Delete customization image
router.delete(
  "/customization/:publicId",

  deleteCustomizationImage,
);

export default router;
