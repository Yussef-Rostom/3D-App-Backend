const axios = require("axios");
const crypto = require("crypto");
const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
require("dotenv").config();

const getPaymentMethods = async (req, res) => {
  try {
    const FawaterakUrl = process.env.FAWATERAK_URL;
    const FawaterakApiKey = process.env.FAWATERAK_VENDOR_KEY;

    const response = await axios.get(`${FawaterakUrl}/getPaymentmethods`, {
      headers: {
        Authorization: `Bearer ${FawaterakApiKey}`,
        "Content-Type": "application/json",
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching payment methods:", error.message);
    res
      .status(500)
      .json({ status: "error", message: "Could not fetch payment methods" });
  }
};

const executePayment = async (req, res) => {
  try {
    const paymentData = req.body;
    const FawaterakUrl = process.env.FAWATERAK_URL;
    const FawaterakApiKey = process.env.FAWATERAK_VENDOR_KEY;

    const checkoutId = paymentData.payLoad?.checkoutId;
    if (!checkoutId) {
      return res.status(400).json({
        status: "fail",
        message: "Payment failed: missing checkoutId in payload.",
      });
    }

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout || checkout.isFinalized) {
      const message = `Payment failed: Checkout not found or already finalized for ID: ${checkoutId}`;
      console.error(message, { body: paymentData });
      return res.status(404).json({ status: "fail", message });
    }

    const response = await axios.post(
      `${FawaterakUrl}/invoiceInitPay`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${FawaterakApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    checkout.status = "pending_payment";
    checkout.paymentDetails = response.data.data.payment_data;
    await checkout.save();

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error executing payment:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ status: "error", message: "Could not execute payment" });
  }
};

const webhook_json = async (req, res) => {
  const fawaterkBody = req.body;
  const secretKey = process.env.FAWATERAK_VENDOR_KEY;

  if (!fawaterkBody || Object.keys(fawaterkBody).length === 0) {
    return res.status(400).send("Bad Request: Empty body.");
  }

  let dataToHash;
  if (fawaterkBody.invoice_id) {
    dataToHash = `InvoiceId=${fawaterkBody.invoice_id}&InvoiceKey=${fawaterkBody.invoice_key}&PaymentMethod=${fawaterkBody.payment_method}`;
  } else if (fawaterkBody.referenceId) {
    dataToHash = `referenceId=${fawaterkBody.referenceId}&PaymentMethod=${fawaterkBody.paymentMethod}`;
  } else {
    return res.status(400).send("Bad Request: Unknown webhook type.");
  }
  const generatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataToHash)
    .digest("hex");
  if (generatedHash !== fawaterkBody.hashKey) {
    return res.status(401).send("Unauthorized: Invalid hash key.");
  }

  console.log("✅ Hash validation successful.");

  try {
    fawaterkBody.pay_load = JSON.parse(fawaterkBody.pay_load);
    const checkoutId = fawaterkBody.pay_load?.checkoutId;
    console.log(fawaterkBody.pay_load);
    if (!checkoutId) {
      // console.warn("Webhook missing checkoutId in pay_load.", {
      //   body: fawaterkBody,
      // });
      return res
        .status(200)
        .json({ message: "Webhook acknowledged, but missing checkoutId." });
    }

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      console.warn(
        `Webhook received for non-existent checkoutId: ${checkoutId}`
      );
      return res
        .status(200)
        .json({ message: "Webhook acknowledged, but checkout not found." });
    }

    if (checkout.isFinalized) {
      console.log(
        `Webhook for already finalized checkout ${checkoutId}. Acknowledged.`
      );
      return res
        .status(200)
        .json({ message: "Acknowledged: Checkout already finalized." });
    }

    if (fawaterkBody.invoice_id && fawaterkBody.invoice_status === "paid") {
      checkout.status = "completed";
      checkout.paymentStatus = "paid";
      checkout.isFinalized = true;
      checkout.FinalizedAt = new Date();

      const order = new Order({
        user: checkout.user,
        items: checkout.items,
        totalPrice: checkout.totalPrice,
        shippingAddress: checkout.shippingAddress,
        paymentDetails: {
          method: fawaterkBody.payment_method,
          invoiceId: fawaterkBody.invoice_id,
          referenceNumber: fawaterkBody.referenceNumber,
        },
        status: "processing",
      });

      await checkout.save();
      await order.save();
      console.log(
        `Successfully created Order ${order._id} from Checkout ${checkoutId}`
      );
    } else if (fawaterkBody.referenceId && fawaterkBody.status === "EXPIRED") {
      checkout.status = "wait_payment";
      checkout.paymentStatus = "failed";
      checkout.isFinalized = false;
      checkout.FinalizedAt = null;
      await checkout.save();
      console.log(`Canceled Checkout ${checkoutId} due to payment expiration.`);
    }

    return res.status(200).send("Webhook processed successfully.");
  } catch (error) {
    console.error("CRITICAL: Server error while processing webhook:", {
      errorMessage: error.message,
      webhookBody: fawaterkBody,
    });
    return res.status(500).send("Internal Server Error");
  }
};

const fail_json = async (req, res) => {
  const fawaterkBody = req.body;

  try {
    fawaterkBody.pay_load = JSON.parse(fawaterkBody.pay_load);
    const checkoutId = fawaterkBody.pay_load?.checkoutId;
    if (!checkoutId) {
      console.warn("Expired webhook missing checkoutId in pay_load.", {
        body: fawaterkBody,
      });
      return res
        .status(200)
        .json({ message: "Webhook acknowledged, but missing checkoutId." });
    }

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      console.warn(
        `Expired webhook received for non-existent checkoutId: ${checkoutId}`
      );
      return res
        .status(200)
        .json({ message: "Webhook acknowledged, but checkout not found." });
    }

    if (checkout.isFinalized) {
      console.log(
        `Webhook for an already finalized checkout received: ${checkoutId}. Acknowledged.`
      );
      return res
        .status(200)
        .json({ message: "Acknowledged: Checkout already finalized." });
    }

    checkout.status = "wait_payment";
    checkout.paymentStatus = "pending_payment";
    checkout.isFinalized = false;
    checkout.FinalizedAt = null;
    await checkout.save();
    console.log(`Successfully canceled Checkout ${checkoutId}`);
  } catch (error) {
    console.error(
      "CRITICAL: A server error occurred while processing webhook:",
      {
        errorMessage: error.message,
        webhookBody: fawaterkBody,
      }
    );
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getPaymentMethods,
  executePayment,
  webhook_json,
  fail_json,
};
