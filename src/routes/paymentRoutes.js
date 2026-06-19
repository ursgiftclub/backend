import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  createRazorpayOrder,
  verifyPayment,
  //   verifyPayment,
} from "../controllers/paymentControllers.js";

const router = express.Router();

router.post("/create-order", protect, createRazorpayOrder);

router.post("/verify", protect, verifyPayment);

export default router;
