const axios = require("axios");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");

function getApiToken() {
  if (env.evolutionPreferInstanceToken && env.evolutionInstanceToken) {
    return env.evolutionInstanceToken;
  }

  return env.evolutionGlobalToken || env.evolutionInstanceToken;
}

function getAuthHeaders() {
  const token = getApiToken();

  if (!token) {
    throw new Error("No Evolution API token configured.");
  }

  if ((env.evolutionAuthType || "").toLowerCase() === "bearer") {
    return {
      [env.evolutionAuthHeader]: `Bearer ${token}`
    };
  }

  return {
    [env.evolutionAuthHeader]: token
  };
}

const client = axios.create({
  baseURL: env.evolutionBaseUrl.replace(/\/+$/, ""),
  timeout: 15000
});

async function sendText(to, text) {
  return client.post(
    `/message/sendText/${env.evolutionInstanceName}`,
    {
      number: to,
      text
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      }
    }
  );
}

async function sendImage(to, imageUrl, caption = "") {
  return client.post(
    `/message/sendMedia/${env.evolutionInstanceName}`,
    {
      number: to,
      mediatype: "image",
      mimetype: "image/jpeg",
      media: imageUrl,
      caption,
      fileName: "welcome-image.jpg"
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      }
    }
  );
}

function getMimeTypeFromExtension(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

async function sendImageFromFile(to, filePath, caption = "") {
  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = getMimeTypeFromExtension(filePath);
  const fileName = path.basename(filePath);

  return client.post(
    `/message/sendMedia/${env.evolutionInstanceName}`,
    {
      number: to,
      mediatype: "image",
      mimetype: mimeType,
      media: fileBuffer.toString("base64"),
      caption,
      fileName
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      }
    }
  );
}

async function sendInternalNotification(text, to = env.notifyNumber) {
  return sendText(to, text);
}

module.exports = {
  sendText,
  sendImage,
  sendImageFromFile,
  sendInternalNotification
};
