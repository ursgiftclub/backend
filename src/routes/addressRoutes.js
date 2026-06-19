import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  createAddress,
  getAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";

const router = express.Router();

router.post("/", protect, createAddress);

router.get("/", protect, getAddresses);

router.get("/:id", protect, getAddress);

router.put("/:id", protect, updateAddress);

router.delete("/:id", protect, deleteAddress);

router.patch("/:id/default", protect, setDefaultAddress);

export default router;
