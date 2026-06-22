import crypto from "crypto";

import razorpay from "../config/razorpay.js";

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";

import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import generateOrderNumber from "../utils/generateOrderNumber.js";
import { createOrderFromCart } from "../utils/createOrderFromCart.js";
import { createGuestOrder } from "../utils/createGuestOrder.js";

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;

  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart || !cart.items.length) {
    throw new AppError("Cart is empty", 400);
  }

  const address = await Address.findOne({
    _id: addressId,
    user: req.user._id,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let finalPrice = 0;

    if (product.productType === "variable") {
      const variant = product.variants.id(item.variantId);

      if (!variant) {
        throw new AppError("Variant not found", 404);
      }

      if (variant.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      finalPrice = variant.salePrice || variant.price;
    } else {
      if (product.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      finalPrice = product.salePrice || product.price;
    }

    subtotal += finalPrice * item.quantity;
  }

  const options = {
    amount: subtotal * 100,

    currency: "INR",

    receipt: `receipt_${Date.now()}`,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  res.status(200).json({
    success: true,

    key: process.env.RAZORPAY_KEY_ID,

    amount: razorpayOrder.amount,

    currency: razorpayOrder.currency,

    razorpayOrderId: razorpayOrder.id,
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    addressId,

    razorpay_order_id,

    razorpay_payment_id,

    razorpay_signature,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  console.log(expectedSignature);
  console.log(razorpay_signature);

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    throw new AppError("Payment verification failed", 400);
  }

  const order = await createOrderFromCart({
    userId: req.user._id,

    addressId,

    paymentMethod: "razorpay",

    paymentStatus: "paid",

    razorpayOrderId: razorpay_order_id,

    razorpayPaymentId: razorpay_payment_id,

    razorpaySignature: razorpay_signature,
  });

  res.status(200).json({
    success: true,

    message: "Payment verified successfully",

    order,
  });
});

export const createGuestRazorpayOrder = asyncHandler(async (req, res) => {
  const { guestInfo, shippingAddress, items } = req.body;

  if (!guestInfo?.fullName) {
    throw new AppError("Guest name is required", 400);
  }

  if (!guestInfo?.email) {
    throw new AppError("Email is required", 400);
  }

  if (!guestInfo?.phone) {
    throw new AppError("Phone is required", 400);
  }

  if (!items?.length) {
    throw new AppError("Cart is empty", 400);
  }

  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let finalPrice = 0;

    if (product.productType === "variable") {
      const variant = product.variants.id(item.variantId);

      if (!variant) {
        throw new AppError("Variant not found", 404);
      }

      if (variant.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      finalPrice = variant.salePrice || variant.price;
    } else {
      if (product.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      finalPrice = product.salePrice || product.price;
    }

    subtotal += finalPrice * item.quantity;
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: subtotal * 100,

    currency: "INR",

    receipt: `guest_${Date.now()}`,
  });

  res.status(200).json({
    success: true,

    key: process.env.RAZORPAY_KEY_ID,

    amount: razorpayOrder.amount,

    currency: razorpayOrder.currency,

    razorpayOrderId: razorpayOrder.id,
  });
});

export const verifyGuestPayment = asyncHandler(async (req, res) => {
  const {
    guestInfo,
    shippingAddress,
    items,

    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Payment details missing", 400);
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    throw new AppError("Payment verification failed", 400);
  }

  const result = await createGuestOrder({
    guestInfo,

    shippingAddress,

    items,

    paymentMethod: "razorpay",

    paymentStatus: "paid",

    razorpayOrderId: razorpay_order_id,

    razorpayPaymentId: razorpay_payment_id,

    razorpaySignature: razorpay_signature,
  });

  res.status(200).json({
    success: true,

    message: "Payment verified successfully",

    order: result.order,

    guestAccessToken: result.guestAccessToken,
  });
});
