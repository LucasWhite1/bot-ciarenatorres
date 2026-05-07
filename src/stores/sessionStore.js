const { createClient } = require("redis");
const env = require("../config/env");

const sessions = new Map();

const STATES = {
  MAIN_MENU: "MAIN_MENU",
  WAITING_RESPONSIBLE_NAME: "WAITING_RESPONSIBLE_NAME",
  WAITING_STUDENT_NAME: "WAITING_STUDENT_NAME",
  WAITING_STUDENT_AGE: "WAITING_STUDENT_AGE",
  WAITING_MODALITY: "WAITING_MODALITY",
  WAITING_SHIFT: "WAITING_SHIFT",
  WAITING_VISIT_DAY: "WAITING_VISIT_DAY",
  WAITING_ORIGIN: "WAITING_ORIGIN",
  WAITING_OTHER_QUESTION: "WAITING_OTHER_QUESTION",
  WAITING_CONFIRM_VISIT: "WAITING_CONFIRM_VISIT"
};

let redisClientPromise = null;

function getDefaultSession() {
  return {
    state: STATES.MAIN_MENU,
    greeted: false,
    cooldownUntil: null,
    data: {}
  };
}

function getRedisKey(phone) {
  return `${env.redisKeyPrefix}:${phone}`;
}

async function getRedisClient() {
  if (!env.redisEnabled) {
    return null;
  }

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const client = createClient({ url: env.redisUrl });
      client.on("error", (error) => {
        console.error("Redis error:", error.message);
      });
      await client.connect();
      return client;
    })().catch((error) => {
      redisClientPromise = null;
      console.error("Redis connection failed, falling back to memory:", error.message);
      return null;
    });
  }

  return redisClientPromise;
}

async function getSession(phone) {
  const client = await getRedisClient();

  if (client) {
    const cached = await client.get(getRedisKey(phone));

    if (cached) {
      return JSON.parse(cached);
    }

    const session = getDefaultSession();
    await client.set(getRedisKey(phone), JSON.stringify(session), {
      EX: env.sessionTtlSeconds
    });
    return session;
  }

  if (!sessions.has(phone)) {
    sessions.set(phone, getDefaultSession());
  }

  return sessions.get(phone);
}

async function updateSession(phone, data) {
  const current = await getSession(phone);
  const next = {
    ...current,
    ...data,
    data: {
      ...current.data,
      ...(data.data || {})
    }
  };

  const client = await getRedisClient();

  if (client) {
    await client.set(getRedisKey(phone), JSON.stringify(next), {
      EX: env.sessionTtlSeconds
    });
    return next;
  }

  sessions.set(phone, next);
  return next;
}

async function clearSession(phone, overrides = {}) {
  const next = {
    ...getDefaultSession(),
    ...overrides,
    data: {
      ...(overrides.data || {})
    }
  };

  const client = await getRedisClient();

  if (client) {
    await client.set(getRedisKey(phone), JSON.stringify(next), {
      EX: env.sessionTtlSeconds
    });
    return next;
  }

  sessions.set(phone, next);
  return next;
}

module.exports = {
  STATES,
  getSession,
  updateSession,
  clearSession
};
