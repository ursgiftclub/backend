import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    productName: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    sku: {
      type: String,
      default: "",
    },

    variant: {
      type: Map,
      of: String,
      default: {},
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
    },

    salePrice: {
      type: Number,
      default: 0,
    },

    finalPrice: {
      type: Number,
      required: true,
    },

    lineTotal: {
      type: Number,
      required: true,
    },

    customization: {
      text: {
        type: String,
        default: "",
      },

      font: {
        type: String,
        default: "",
      },

      images: [
        {
          url: String,
          public_id: String,
        },
      ],
    },
  },
  {
    _id: false,
  },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    alternatePhone: {
      type: String,
      default: "",
    },

    addressLine1: {
      type: String,
      required: true,
    },

    addressLine2: {
      type: String,
      default: "",
    },

    landmark: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      default: "India",
    },

    pincode: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    guestInfo: {
      fullName: String,

      email: String,

      phone: String,
    },

    guestAccessToken: {
      type: String,
      default: "",
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    shippingCharge: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ user: 1 });

orderSchema.index({ orderStatus: 1 });

orderSchema.index({ paymentStatus: 1 });

orderSchema.index({
  razorpayOrderId: 1,
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
