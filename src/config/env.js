const dotenv = require("dotenv");

dotenv.config();

function toBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
}

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const env = {
  port: Number(process.env.PORT || 3000),
  evolutionBaseUrl: requireEnv("EVOLUTION_BASE_URL"),
  evolutionGlobalToken: process.env.EVOLUTION_GLOBAL_TOKEN || "",
  evolutionInstanceName: requireEnv("EVOLUTION_INSTANCE_NAME"),
  evolutionInstanceToken: process.env.EVOLUTION_INSTANCE_TOKEN || "",
  evolutionAuthType: process.env.EVOLUTION_AUTH_TYPE || "apikey",
  evolutionAuthHeader: process.env.EVOLUTION_AUTH_HEADER || "apikey",
  evolutionPreferInstanceToken: toBoolean(
    process.env.EVOLUTION_PREFER_INSTANCE_TOKEN,
    true
  ),
  welcomeImageUrl: process.env.WELCOME_IMAGE_URL || "",
  notifyNumber: requireEnv("NOTIFY_NUMBER"),
  ownerPaymentNotifyNumber: requireEnv("OWNER_PAYMENT_NOTIFY_NUMBER"),
  pixKey: requireEnv("PIX_KEY"),
  monthlyDueDay: requireEnv("MONTHLY_DUE_DAY"),
  monthlyPrice: requireEnv("MONTHLY_PRICE"),
  attendantNumber: requireEnv("ATTENDANT_NUMBER"),
  billingSecret: requireEnv("BILLING_SECRET"),
  redisEnabled: toBoolean(process.env.REDIS_ENABLED, false),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisKeyPrefix: process.env.REDIS_KEY_PREFIX || "cia-renato-torres:session",
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS || 86400),
  menuCooldownMinutes: Number(process.env.MENU_COOLDOWN_MINUTES || 60),
  businessName:
    process.env.BUSINESS_NAME || "Cia. Artistica Renato Torres",
  businessInstagram: process.env.BUSINESS_INSTAGRAM || "@ciarenatotorres"
};

module.exports = env;
