const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  err.message = err.message || "Internal Server Error";

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    err.message = `${field} already exists`;
    err.statusCode = 400;
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    err.message = "Invalid resource id";

    err.statusCode = 400;
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    err.message = "Invalid token";

    err.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    err.message = "Token expired";

    err.statusCode = 401;
  }

  console.log(err);
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default errorMiddleware;
