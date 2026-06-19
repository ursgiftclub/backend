import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

const formatCartResponse = async (items) => {
  const cartItems = [];

  let subtotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) continue;

    let price = 0;
    let salePrice = 0;
    let stock = 0;
    let image = null;
    let variantData = null;

    if (product.productType === "variable") {
      const variant = product.variants.id(item.variantId);

      if (!variant) continue;

      variantData = variant;

      price = variant.price;

      salePrice = variant.salePrice;

      stock = variant.stock;

      image =
        product.commonImages?.[variant.mainImageIndex]?.url ||
        product.commonImages?.[0]?.url;
    } else {
      price = product.price;

      salePrice = product.salePrice;

      stock = product.stock;

      image = product.commonImages?.[0]?.url;
    }

    const finalPrice = salePrice || price;

    subtotal += finalPrice * item.quantity;

    itemCount += item.quantity;

    cartItems.push({
      cartItemId: item._id,

      productId: product._id,

      variantId: item.variantId || null,

      name: product.name,

      slug: product.slug,

      image,

      quantity: item.quantity,

      stock,

      price,

      salePrice,

      finalPrice,

      lineTotal: finalPrice * item.quantity,

      customization: item.customization || {},

      variant: variantData
        ? {
            _id: variantData._id,

            sku: variantData.sku,

            combination: Object.fromEntries(variantData.combination),

            image:
              product.commonImages?.[variantData.mainImageIndex - 1]?.url ||
              product.commonImages?.[0]?.url,
          }
        : null,
    });
  }

  return {
    subtotal,
    itemCount,
    items: cartItems,
  };
};

// ======================================
// Get Cart
// ======================================
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
    });
  }

  const data = await formatCartResponse(cart.items);

  res.status(200).json({
    success: true,
    ...data,
  });
});

// ======================================
// Add To Cart
// ======================================
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1, customization = {} } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Variable Product
  if (product.productType === "variable") {
    const variant = product.variants.id(variantId);

    if (!variant) {
      throw new AppError("Variant not found", 404);
    }

    if (variant.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }
  }

  // Simple Product
  else {
    if (product.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }
  }

  // Customization Validation
  if (product.customization?.enabled) {
    if (
      product.customization.allowImage &&
      (customization.images?.length || 0) <
        (product.customization.minImages || 0)
    ) {
      throw new AppError(
        `Minimum ${product.customization.minImages} image required`,
        400,
      );
    }

    if (
      product.customization.allowImage &&
      (customization.images?.length || 0) >
        (product.customization.maxImages || 999)
    ) {
      throw new AppError(
        `Maximum ${product.customization.maxImages} images allowed`,
        400,
      );
    }

    if (
      product.customization.allowText &&
      customization.text &&
      customization.text.length > (product.customization.maxCharacters || 9999)
    ) {
      throw new AppError("Text exceeds character limit", 400);
    }
  }

  let cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      String(item.variantId) === String(variantId) &&
      JSON.stringify(item.customization || {}) ===
        JSON.stringify(customization || {}),
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      variantId: variantId || null,
      quantity,
      customization,
    });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Added to cart",
    cart,
  });
});

// ======================================
// Update Cart Item
// ======================================
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError("Invalid quantity", 400);
  }

  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    throw new AppError("Cart item not found", 404);
  }

  const product = await Product.findById(item.product);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (item.variantId) {
    const variant = product.variants.id(item.variantId);

    if (!variant) {
      throw new AppError("Variant not found", 404);
    }

    if (quantity > variant.stock) {
      throw new AppError("Insufficient stock", 400);
    }
  } else {
    if (quantity > product.stock) {
      throw new AppError("Insufficient stock", 400);
    }
  }

  item.quantity = quantity;

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart updated",
    cart,
  });
});

// ======================================
// Remove Cart Item
// ======================================
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId,
  );

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Item removed",
    cart,
  });
});

// ======================================
// Clear Cart
// ======================================
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = [];

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart cleared",
  });
});

// ======================================
// Merge Guest Cart
// ======================================
export const mergeGuestCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;

  let cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
    });
  }

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) continue;

    const existingItem = cart.items.find(
      (cartItem) =>
        cartItem.product.toString() === item.productId &&
        String(cartItem.variantId) === String(item.variantId),
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.items.push({
        product: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        customization: item.customization || {},
      });
    }
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Guest cart merged",
    cart,
  });
});

// ======================================
// Guest Cart Details
// ======================================
export const getGuestCartDetails = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;

  const data = await formatCartResponse(
    items.map((item) => ({
      _id: item.cartItemId,
      product: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      customization: item.customization,
    })),
  );

  res.status(200).json({
    success: true,
    ...data,
  });
});
