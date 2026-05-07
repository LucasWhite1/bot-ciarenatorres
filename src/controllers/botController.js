const env = require("../config/env");
const {
  STATES,
  getSession,
  updateSession,
  clearSession
} = require("../stores/sessionStore");
const {
  sendText,
  sendImage,
  sendInternalNotification
} = require("../services/evolutionService");
const normalizeText = require("../utils/normalizeText");
const {
  formatLeadSummary,
  formatAttendantSummary
} = require("../utils/leadFormatter");

const MENU_HINT = 'Para voltar ao menu, digite "Menu".';
const COOLDOWN_MS = env.menuCooldownMinutes * 60 * 1000;

const MAIN_MENU_MESSAGE = [
  "Olá! Tudo bem? 😊",
  "",
  "Sou o Nill, atendente virtual da Cia. Renato Torres.",
  "",
  "Como posso te ajudar?",
  "",
  "1️⃣ Marcar visita/aula teste",
  "2️⃣ Dias e horários",
  "3️⃣ Localização",
  "4️⃣ Valores e matrícula",
  "5️⃣ Modalidades",
  "6️⃣ Documentos para matrícula",
  "7️⃣ Uniforme",
  "8️⃣ Falar com atendente",
  "",
  'Digite "Menu" quando quiser voltar.'
].join("\n");

const SHORT_FALLBACK_MENU = [
  "Posso te ajudar por aqui 😊",
  "",
  "Escolha uma opção:",
  "",
  "1️⃣ Marcar visita/aula teste",
  "2️⃣ Horários",
  "3️⃣ Localização",
  "4️⃣ Valores",
  "5️⃣ Modalidades",
  "6️⃣ Falar com atendente",
  "",
  'Digite "Menu" para voltar.'
].join("\n");

const MODALITY_OPTIONS = {
  "1": "Ballet",
  "2": "Jazz / Dança Moderna",
  "3": "Teatro",
  "4": "Musicalização",
  "5": "Expressão corporal",
  "6": "Ainda não sei"
};

const SHIFT_OPTIONS = {
  "1": "Manhã",
  "2": "Tarde",
  "3": "Sábado",
  "4": "Ainda não sei"
};

const ORIGIN_OPTIONS = {
  "1": "Instagram",
  "2": "Indicação",
  "3": "WhatsApp",
  "4": "Passando pelo local",
  "5": "Outro"
};

async function safeSend(callback) {
  try {
    await callback();
  } catch (error) {
    console.error("Failed to send message:", error.response?.data || error.message);
  }
}

function isResetCommand(text) {
  return text === "menu" || text === "reiniciar";
}

function mapChoice(input, options) {
  return options[input] || null;
}

function inferAgeGroup(age) {
  if (age >= 3 && age <= 6) {
    return "Baby Class";
  }

  if (age >= 10 && age <= 13) {
    return "Pré-preparatório";
  }

  if (age >= 12 && age <= 18) {
    return "Grau";
  }

  if (age >= 3 && age <= 8) {
    return "Iniciação teatral";
  }

  if (age >= 8 && age <= 13) {
    return "Intermediário";
  }

  if (age >= 14 && age <= 20) {
    return "Avançado";
  }

  return "Avaliação na aula teste";
}

function getCooldownUntil() {
  return new Date(Date.now() + COOLDOWN_MS).toISOString();
}

function isInCooldown(session) {
  return Boolean(
    session.cooldownUntil && new Date(session.cooldownUntil).getTime() > Date.now()
  );
}

async function sendMainMenu(phone, session, forceImage = false) {
  const shouldSendImage = env.welcomeImageUrl && (!session.greeted || forceImage);

  if (shouldSendImage) {
    await safeSend(() => sendImage(phone, env.welcomeImageUrl, env.businessName));
  }

  await safeSend(() => sendText(phone, MAIN_MENU_MESSAGE));
  return updateSession(phone, {
    state: STATES.MAIN_MENU,
    greeted: true,
    cooldownUntil: null
  });
}

async function finishFlow(phone) {
  return clearSession(phone, {
    greeted: false,
    cooldownUntil: getCooldownUntil()
  });
}

async function startVisitFlow(phone) {
  await updateSession(phone, {
    state: STATES.WAITING_RESPONSIBLE_NAME,
    greeted: true,
    data: {}
  });

  return safeSend(() =>
    sendText(
      phone,
      "Perfeito! Vamos marcar sua visita/aula teste 😊\n\nPrimeiro, me informe o nome e sobrenome do responsável.\n\n" +
        MENU_HINT
    )
  );
}

async function handleMainMenu(phone, text) {
  switch (text) {
    case "1":
      return startVisitFlow(phone);
    case "2":
      await safeSend(() =>
        sendText(
          phone,
          "Nossa grade funciona assim:\n\n🩰 Segundas e quartas:\nBallet / Clássico / Contemporâneo"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "💃 Terças e quintas:\nJazz Kids / Jazz Dance / Dança Moderna\n\n🎭 Sábados:\nTeatro e musicalização"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Temos turmas pela manhã e tarde.\n\nQuer marcar uma visita/aula teste?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "3":
      await safeSend(() =>
        sendText(
          phone,
          "Estamos na:\n\n📍 Estr. do Coqueiro Grande, 8\nFazenda Grande 2 - Salvador/BA"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Em frente ao Atacadão de Cajazeiras.\n\nQuer marcar uma visita?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "4":
      await safeSend(() =>
        sendText(
          phone,
          "A mensalidade é R$ 169,00.\n\nTemos desconto de 50% na matrícula caso você indique alguém."
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Aluno já matriculado que indicar ganha 5% de desconto 😊\n\nQuer marcar uma visita/aula teste?\n1️⃣ Sim\n2️⃣ Ver documentos\n3️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, {
        state: STATES.WAITING_CONFIRM_VISIT,
        data: { confirmContext: "values" }
      });
    case "5":
      await safeSend(() =>
        sendText(
          phone,
          "Temos várias modalidades artísticas:\n\n🩰 Ballet\n💃 Jazz Dance\n🎭 Teatro"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "🎶 Musicalização Infantil\n🤸 Ginástica Rítmica\n✨ Expressão Corporal"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Quem se matricula em uma modalidade participa de outras atividades do projeto.\n\nQuer marcar uma aula teste?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "6":
      await safeSend(() =>
        sendText(
          phone,
          "Para matrícula, trazer:\n\n✅ RG ou certidão do aluno\n✅ CPF do aluno e responsável"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "✅ Comprovante de residência\n✅ Declaração escolar\n✅ Atestado/relatório médico, se necessário"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Quer marcar uma visita antes da matrícula?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "7":
      await safeSend(() =>
        sendText(phone, "O fardamento é exclusivo da companhia.\n\nValor: R$ 210,00")
      );
      await safeSend(() =>
        sendText(
          phone,
          "Inclui collant, saia, tiara e item promocional.\n\nPode pagar via Pix, cartão ou transferência."
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Quer saber sobre a aula teste?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "8":
      await updateSession(phone, { state: STATES.WAITING_OTHER_QUESTION });
      return safeSend(() =>
        sendText(
          phone,
          "Claro 😊\n\nAntes de chamar um atendente, me diga rapidamente:\n\nQual é a dúvida?"
        )
      );
    default:
      return safeSend(() => sendText(phone, SHORT_FALLBACK_MENU));
  }
}

async function handleConfirmVisit(phone, text, session) {
  if (text === "1") {
    return startVisitFlow(phone);
  }

  if (text === "2" && session.data.confirmContext === "values") {
    await safeSend(() =>
      sendText(
        phone,
        "Para matrícula, trazer:\n\n✅ RG ou certidão do aluno\n✅ CPF do aluno e responsável"
      )
    );
    await safeSend(() =>
      sendText(
        phone,
        "✅ Comprovante de residência\n✅ Declaração escolar\n✅ Atestado/relatório médico, se necessário"
      )
    );
    return sendMainMenu(phone, session);
  }

  return sendMainMenu(phone, session);
}

async function handleMessage(phone, incomingText) {
  const text = normalizeText(incomingText);
  let session = await getSession(phone);

  if (isResetCommand(text)) {
    session = await clearSession(phone);
    return sendMainMenu(phone, session, true);
  }

  if (!session.greeted) {
    if (isInCooldown(session)) {
      await updateSession(phone, { greeted: true, cooldownUntil: null });
      return handleMainMenu(phone, text);
    }

    await sendMainMenu(phone, session, true);
    return null;
  }

  switch (session.state) {
    case STATES.MAIN_MENU:
      return handleMainMenu(phone, text);
    case STATES.WAITING_RESPONSIBLE_NAME:
      await updateSession(phone, {
        state: STATES.WAITING_STUDENT_NAME,
        data: { responsibleName: incomingText.trim() }
      });
      return safeSend(() =>
        sendText(phone, "Agora me informe o nome e sobrenome do aluno.\n\n" + MENU_HINT)
      );
    case STATES.WAITING_STUDENT_NAME:
      await updateSession(phone, {
        state: STATES.WAITING_STUDENT_AGE,
        data: { studentName: incomingText.trim() }
      });
      return safeSend(() =>
        sendText(phone, "Quantos anos o aluno tem?\n\n" + MENU_HINT)
      );
    case STATES.WAITING_STUDENT_AGE: {
      const age = Number(incomingText.replace(/\D/g, ""));

      if (!age) {
        return safeSend(() =>
          sendText(phone, "Me informe apenas a idade em número, por favor.")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_MODALITY,
        data: {
          studentAge: age,
          suggestedGroup: inferAgeGroup(age)
        }
      });

      await safeSend(() =>
        sendText(
          phone,
          "Certo! Pela idade, vamos indicar o grupo mais adequado após a aula teste."
        )
      );

      return safeSend(() =>
        sendText(
          phone,
          "Qual modalidade tem mais interesse?\n\n1️⃣ Ballet\n2️⃣ Jazz / Dança Moderna\n3️⃣ Teatro\n4️⃣ Musicalização\n5️⃣ Expressão corporal\n6️⃣ Ainda não sei"
        )
      );
    }
    case STATES.WAITING_MODALITY: {
      const modality = mapChoice(text, MODALITY_OPTIONS);

      if (!modality) {
        return safeSend(() =>
          sendText(phone, "Escolha uma opção de 1 a 6, por favor.")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_SHIFT,
        data: { modality }
      });

      return safeSend(() =>
        sendText(
          phone,
          "Qual turno seria melhor?\n\n1️⃣ Manhã\n2️⃣ Tarde\n3️⃣ Sábado\n4️⃣ Ainda não sei"
        )
      );
    }
    case STATES.WAITING_SHIFT: {
      const shift = mapChoice(text, SHIFT_OPTIONS);

      if (!shift) {
        return safeSend(() =>
          sendText(phone, "Escolha uma opção de 1 a 4, por favor.")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_VISIT_DAY,
        data: { shift }
      });

      return safeSend(() =>
        sendText(
          phone,
          "Qual melhor dia para visita ou aula teste?\nPode responder com o dia da semana."
        )
      );
    }
    case STATES.WAITING_VISIT_DAY:
      await updateSession(phone, {
        state: STATES.WAITING_ORIGIN,
        data: { visitDay: incomingText.trim() }
      });
      return safeSend(() =>
        sendText(
          phone,
          "Como você conheceu a Cia. Renato Torres?\n\n1️⃣ Instagram\n2️⃣ Indicação\n3️⃣ WhatsApp\n4️⃣ Passando pelo local\n5️⃣ Outro"
        )
      );
    case STATES.WAITING_ORIGIN: {
      const origin = mapChoice(text, ORIGIN_OPTIONS);

      if (!origin) {
        return safeSend(() =>
          sendText(phone, "Escolha uma opção de 1 a 5, por favor.")
        );
      }

      const updated = await updateSession(phone, {
        state: STATES.MAIN_MENU,
        data: { origin }
      });
      const lead = {
        ...updated.data,
        origin,
        phone
      };

      await safeSend(() =>
        sendText(
          phone,
          "Pronto! Sua solicitação foi registrada 😊\n\nNossa equipe vai conferir a agenda e confirmar o melhor horário."
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "📍 Cia. Renato Torres\nEstr. do Coqueiro Grande, 8\nEm frente ao Atacadão de Cajazeiras"
        )
      );
      await safeSend(() => sendInternalNotification(formatLeadSummary(lead)));
      await finishFlow(phone);
      return null;
    }
    case STATES.WAITING_OTHER_QUESTION: {
      const question = incomingText.trim();

      await safeSend(() =>
        sendInternalNotification(
          formatAttendantSummary({
            phone,
            question
          }),
          env.attendantNumber
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Certo! Encaminhei sua dúvida para um atendente.\n\nAssim que possível, alguém da equipe vai te responder 😊"
        )
      );
      await finishFlow(phone);
      return null;
    }
    case STATES.WAITING_CONFIRM_VISIT:
      return handleConfirmVisit(phone, text, session);
    default:
      session = await clearSession(phone);
      return sendMainMenu(phone, session, true);
  }
}

module.exports = {
  handleMessage
};
