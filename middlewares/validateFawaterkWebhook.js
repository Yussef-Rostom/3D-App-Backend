const crypto = require("crypto");

const validateFawaterkWebhook = (body, type) => {
  const secretKey = process.env.FAWATERAK_VENDOR_KEY;
  if (!secretKey) {
    console.error("FAWATERAK_VENDOR_KEY is not set in environment variables.");
    return false;
  }

  let stringToHash = "";
  if (type === "paid") {
    stringToHash = `InvoiceId=${body.invoice_id}&InvoiceKey=${body.invoice_key}&PaymentMethod=${body.payment_method}`;
  } else if (type === "expired") {
    stringToHash = `referenceId=${body.referenceId}&PaymentMethod=${body.paymentMethod}`;
  } else {
    return false;
  }
  const generatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(stringToHash)
    .digest("hex");

  return generatedHash === body.hashKey;
};

module.exports = validateFawaterkWebhook;
