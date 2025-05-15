// utils/responseHandler.js
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({
    success,
    message,
    data
  });
};

module.exports = { sendResponse };