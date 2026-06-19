import express from "express";

import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart,
  getGuestCartDetails,
} from "../controllers/cartController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// User Cart
router.get("/", protect, getCart);

router.post("/add", protect, addToCart);

router.put("/item/:itemId", protect, updateCartItem);

router.delete("/item/:itemId", protect, removeCartItem);

router.delete("/clear", protect, clearCart);

// Guest -> User Merge
router.post("/merge", protect, mergeGuestCart);

router.post("/guest/details", getGuestCartDetails);

export default router;
