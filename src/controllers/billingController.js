const env = require("../config/env");
const { sendText } = require("../services/evolutionService");

async function sendReminder(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const expected = `Bearer ${env.billingSecret}`;

    if (authHeader !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const message = [
      "Olá! 😊",
      "",
      `Passando para lembrar que a mensalidade do sistema vence dia ${env.monthlyDueDay}.`,
      "",
      `Valor: R$ ${env.monthlyPrice}`,
      "",
      "Pix:",
      env.pixKey
    ].join("\n");

    await sendText(env.ownerPaymentNotifyNumber, message);

    return res.json({
      success: true,
      message: "Billing reminder sent successfully."
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendReminder
};
