const express = require("express");
const { sendReminder } = require("../controllers/billingController");

const router = express.Router();

router.post("/billing/send-reminder", sendReminder);

module.exports = router;
