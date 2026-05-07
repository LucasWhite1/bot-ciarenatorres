const express = require("express");
const { handleMessage } = require("../controllers/botController");

const router = express.Router();
const processedMessages = new Map();
const DEDUPE_TTL_MS = 2 * 60 * 1000;

function cleanupProcessedMessages() {
  const now = Date.now();

  for (const [key, expiresAt] of processedMessages.entries()) {
    if (expiresAt <= now) {
      processedMessages.delete(key);
    }
  }
}

function markMessageProcessed(messageKey) {
  cleanupProcessedMessages();
  processedMessages.set(messageKey, Date.now() + DEDUPE_TTL_MS);
}

function hasProcessedMessage(messageKey) {
  cleanupProcessedMessages();
  return processedMessages.has(messageKey);
}

function extractPayloadInfo(body) {
  const data = body?.data || body;
  const key = data?.key || body?.key || {};
  const message = data?.message || body?.message || {};

  const remoteJid =
    key.remoteJid ||
    data?.key?.remoteJid ||
    body?.sender ||
    body?.from ||
    "";

  const phone = String(remoteJid).split("@")[0].replace(/\D/g, "");

  const text =
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    data?.messageType?.text ||
    body?.text ||
    "";

  const fromMe = Boolean(
    key.fromMe ??
      data?.fromMe ??
      body?.fromMe ??
      body?.data?.key?.fromMe
  );

  const messageId =
    key.id ||
    data?.id ||
    body?.id ||
    [phone, text, data?.messageTimestamp || body?.messageTimestamp || ""].join(":");

  return {
    phone,
    text,
    fromMe,
    messageId
  };
}

router.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

router.post("/webhook/evolution", (req, res) => {
  const payloadInfo = extractPayloadInfo(req.body);
  res.status(200).json({ received: true });

  if (!payloadInfo.phone || !payloadInfo.text || payloadInfo.fromMe) {
    return;
  }

  if (payloadInfo.messageId && hasProcessedMessage(payloadInfo.messageId)) {
    return;
  }

  if (payloadInfo.messageId) {
    markMessageProcessed(payloadInfo.messageId);
  }

  handleMessage(payloadInfo.phone, payloadInfo.text).catch((error) => {
    console.error("Bot controller error:", error.response?.data || error.message);
  });
});

module.exports = router;
