const axios = require("axios");
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

async function sendInternalNotification(text, to = env.notifyNumber) {
  return sendText(to, text);
}

module.exports = {
  sendText,
  sendImage,
  sendInternalNotification
};
