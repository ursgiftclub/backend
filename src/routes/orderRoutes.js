import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrder,
  getGuestOrderById,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/", protect, getMyOrders);

router.get("/:id", protect, getOrderById);

router.get("/guest/:id", getGuestOrderById);

export default router;
