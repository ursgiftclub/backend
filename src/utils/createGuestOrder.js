import Product from "../models/Product.js";
import Order from "../models/Order.js";

import AppError from "./AppError.js";
import generateOrderNumber from "./generateOrderNumber.js";
import crypto from "crypto";

export const createGuestOrder = async ({
  guestInfo,
  shippingAddress,
  items,

  paymentMethod = "razorpay",
  paymentStatus = "paid",

  razorpayOrderId = "",
  razorpayPaymentId = "",
  razorpaySignature = "",
}) => {
  if (!items?.length) {
    throw new AppError("Cart is empty", 400);
  }

  const orderItems = [];

  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let price = 0;
    let salePrice = 0;
    let finalPrice = 0;

    let image = "";
    let sku = "";

    let variantMap = {};

    // VARIABLE PRODUCT
    if (product.productType === "variable") {
      const variant = product.variants.id(item.variantId);

      if (!variant) {
        throw new AppError(`${product.name} variant not found`, 404);
      }

      if (variant.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      variant.stock -= item.quantity;

      price = variant.price;

      salePrice = variant.salePrice;

      finalPrice = salePrice || price;

      sku = variant.sku;

      variantMap = Object.fromEntries(variant.combination);

      image =
        product.commonImages?.[variant.mainImageIndex]?.url ||
        product.commonImages?.[0]?.url ||
        "";

      await product.save();
    }

    // SIMPLE PRODUCT
    else {
      if (product.stock < item.quantity) {
        throw new AppError(`${product.name} is out of stock`, 400);
      }

      product.stock -= item.quantity;

      price = product.price;

      salePrice = product.salePrice;

      finalPrice = salePrice || price;

      sku = product.sku;

      image = product.commonImages?.[0]?.url || "";

      await product.save();
    }

    const lineTotal = finalPrice * item.quantity;

    subtotal += lineTotal;

    orderItems.push({
      productId: product._id,

      variantId: item.variantId || null,

      productName: product.name,

      slug: product.slug,

      image,

      sku,

      variant: variantMap,

      quantity: item.quantity,

      price,

      salePrice,

      finalPrice,

      lineTotal,

      customization: item.customization || {
        text: "",
        font: "",
        images: [],
      },
    });
  }

  const shippingCharge = 0;

  const discount = 0;

  const totalAmount = subtotal + shippingCharge - discount;

  const guestAccessToken = crypto.randomBytes(32).toString("hex");

  const order = await Order.create({
    orderNumber: generateOrderNumber(),

    user: null,

    guestInfo,

    guestAccessToken,

    items: orderItems,

    shippingAddress,

    subtotal,

    shippingCharge,

    discount,

    totalAmount,

    paymentMethod,

    paymentStatus,

    razorpayOrderId,

    razorpayPaymentId,

    razorpaySignature,
  });

  return {
    order,
    guestAccessToken,
  };
};
