const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = () => {};
// const asyncHandler = (fu) => {async() => {}};
//  const asyncHandler = (fu) => {async(req, res, next) => {
// try {
//   await fu(re, res, next)
// } catch (err) {
//   res.status(err.code || 500).json({
//     success: false,
//     message: err.message
//   })
// }
// }};
