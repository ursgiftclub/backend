import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";

import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

import generateOrderNumber from "../utils/generateOrderNumber.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod = "cod" } = req.body;

  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart || !cart.items.length) {
    throw new AppError("Cart is empty", 400);
  }

  console.log(addressId, " ", req.user._id);
  const address = await Address.findOne({
    _id: addressId,
    user: req.user._id,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  const orderItems = [];

  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let price = 0;
    let salePrice = 0;
    let finalPrice = 0;
    let image = "";
    let sku = "";
    let variantData = {};

    // Variable Product
    if (product.productType === "variable") {
      const variant = product.variants.id(item.variantId);

      if (!variant) {
        throw new AppError(`${product.name} variant not found`, 404);
      }

      if (variant.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      variant.stock -= item.quantity;

      await product.save();

      price = variant.price;

      salePrice = variant.salePrice;

      finalPrice = salePrice || price;

      sku = variant.sku;

      variantData = Object.fromEntries(variant.combination);

      image =
        product.commonImages?.[(variant.mainImageIndex || 1) - 1]?.url ||
        product.commonImages?.[0]?.url ||
        "";
    }

    // Simple Product
    else {
      if (product.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      product.stock -= item.quantity;

      await product.save();

      price = product.price;

      salePrice = product.salePrice;

      finalPrice = salePrice || price;

      sku = product.sku;

      image = product.commonImages?.[0]?.url || "";
    }

    const lineTotal = finalPrice * item.quantity;

    subtotal += lineTotal;

    orderItems.push({
      productId: product._id,

      variantId: product.productType === "variable" ? item.variantId : null,

      productName: product.name,

      slug: product.slug,

      image,

      sku,

      variant: variantData,

      quantity: item.quantity,

      price,

      salePrice,

      finalPrice,

      lineTotal,

      customization: item.customization,
    });
  }

  const shippingCharge = 0;

  const discount = 0;

  const totalAmount = subtotal + shippingCharge - discount;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),

    user: req.user._id,

    items: orderItems,

    shippingAddress: {
      fullName: address.fullName,

      phone: address.phone,

      alternatePhone: address.alternatePhone,

      addressLine1: address.addressLine1,

      addressLine2: address.addressLine2,

      landmark: address.landmark,

      city: address.city,

      state: address.state,

      country: address.country,

      pincode: address.pincode,
    },

    subtotal,

    shippingCharge,

    discount,

    totalAmount,

    paymentMethod,
  });

  cart.items = [];

  await cart.save();

  res.status(201).json({
    success: true,

    message: "Order placed successfully",

    order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  })
    .select("orderNumber totalAmount paymentStatus orderStatus createdAt items")
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,

    user: req.user._id,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.status(200).json({
    success: true,
    order,
  });
});

export const getGuestOrderById = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new AppError("Access token missing", 401);
  }

  const order = await Order.findOne({
    _id: req.params.id,

    user: null,

    guestAccessToken: token,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.status(200).json({
    success: true,

    order,
  });
});
