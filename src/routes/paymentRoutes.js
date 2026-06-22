import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  createGuestRazorpayOrder,
  createRazorpayOrder,
  verifyGuestPayment,
  verifyPayment,
  //   verifyPayment,
} from "../controllers/paymentControllers.js";

const router = express.Router();

router.post("/create-order", protect, createRazorpayOrder);

router.post("/create-order-guest", createGuestRazorpayOrder);

router.post("/verify", protect, verifyPayment);

router.post("/verify-guest", verifyGuestPayment);

export default router;
