const express = require("express");
const { handleMessage } = require("../controllers/botController");
const normalizeText = require("../utils/normalizeText");

const router = express.Router();

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

  return {
    phone,
    text,
    normalizedText: normalizeText(text),
    fromMe
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

  handleMessage(payloadInfo.phone, payloadInfo.text).catch(
    (error) => {
      console.error("Bot controller error:", error.response?.data || error.message);
    }
  );
});

module.exports = router;
