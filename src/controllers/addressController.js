import Address from "../models/Address.js";

import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

// ======================================
// Create Address
// ======================================
export const createAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    alternatePhone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    country,
    pincode,
    addressType,
    isDefault,
  } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    throw new AppError("Please fill all required fields", 400);
  }

  if (isDefault) {
    await Address.updateMany(
      {
        user: req.user._id,
      },
      {
        isDefault: false,
      },
    );
  }

  const address = await Address.create({
    user: req.user._id,

    fullName,
    phone,
    alternatePhone,

    addressLine1,
    addressLine2,

    landmark,

    city,
    state,
    country,

    pincode,

    addressType,

    isDefault,
  });

  res.status(201).json({
    success: true,
    message: "Address created successfully",
    address,
  });
});

// ======================================
// Get All Addresses
// ======================================
export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({
    user: req.user._id,
  }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    addresses,
  });
});

// ======================================
// Get Single Address
// ======================================
export const getAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  res.status(200).json({
    success: true,
    address,
  });
});

// ======================================
// Update Address
// ======================================
export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  if (req.body.isDefault) {
    await Address.updateMany(
      {
        user: req.user._id,
      },
      {
        isDefault: false,
      },
    );
  }

  Object.assign(address, req.body);

  await address.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    address,
  });
});

// ======================================
// Delete Address
// ======================================
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  await address.deleteOne();

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
});

// ======================================
// Set Default Address
// ======================================
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  if (address.isDefault) {
    return res.status(200).json({
      success: true,
      message: "Address is already default",
      address,
    });
  }

  await Address.updateMany(
    {
      user: req.user._id,
    },
    {
      isDefault: false,
    },
  );

  address.isDefault = true;

  await address.save();

  res.status(200).json({
    success: true,
    message: "Default address updated",
    address,
  });
});
