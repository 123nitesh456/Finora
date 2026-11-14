// Small helper to create errors that carry an HTTP status code.
// Usage: throw httpError(404, 'Transaction not found');
const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export default httpError;
