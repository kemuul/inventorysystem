// middleware/errorHandler.js
// Catches any error passed via next(err) or thrown inside an async route
// (see the asyncHandler wrapper below) and returns a consistent JSON shape.

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

// Wraps an async controller so thrown errors / rejected promises are
// forwarded to errorHandler instead of crashing the process.
// Usage: router.get('/', asyncHandler(controller.getAll));
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
