exports.notFound = (req, res, next) => {
  res.status(404).json({
    status: 404,
    message: 'Route not found',
  });
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message:
      err.message || 'An unexpected error occurred. Please try again later.',
  });
};

