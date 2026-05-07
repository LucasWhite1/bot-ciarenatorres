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
  "Ola! Tudo bem? :)",
  "",
  "Sou o Nill, atendente virtual da Cia. Renato Torres.",
  "",
  "Como posso te ajudar?",
  "",
  "1️⃣ Marcar visita/aula teste",
  "2️⃣ Dias e horarios",
  "3️⃣ Localizacao",
  "4️⃣ Valores e matricula",
  "5️⃣ Modalidades",
  "6️⃣ Documentos para matricula",
  "7️⃣ Uniforme",
  "8️⃣ Falar com atendente",
  "",
  'Digite "Menu" quando quiser voltar.'
].join("\n");

const SHORT_FALLBACK_MENU = [
  "Posso te ajudar por aqui :)",
  "",
  "Escolha uma opcao:",
  "",
  "1️⃣ Marcar visita/aula teste",
  "2️⃣ Horarios",
  "3️⃣ Localizacao",
  "4️⃣ Valores",
  "5️⃣ Modalidades",
  "6️⃣ Falar com atendente",
  "",
  'Digite "Menu" para voltar.'
].join("\n");

const MODALITY_OPTIONS = {
  "1": "Ballet",
  "2": "Jazz / Danca Moderna",
  "3": "Teatro",
  "4": "Musicalizacao",
  "5": "Expressao corporal",
  "6": "Ainda nao sei"
};

const SHIFT_OPTIONS = {
  "1": "Manha",
  "2": "Tarde",
  "3": "Sabado",
  "4": "Ainda nao sei"
};

const ORIGIN_OPTIONS = {
  "1": "Instagram",
  "2": "Indicacao",
  "3": "WhatsApp",
  "4": "Passando pelo local",
  "5": "Outro"
};

const PRICE_MODALITY_OPTIONS = {
  "1": "Ballet",
  "2": "Jazz / Danca Moderna",
  "3": "Teatro",
  "4": "Musicalizacao Infantil",
  "5": "Expressao Corporal / Ginastica Ritmica",
  "6": "Ainda nao sei"
};

const HELP_KEYWORD_RULES = [
  {
    keywords: ["horario", "horarios", "dias", "funciona", "turma", "turno"],
    messages: [
      "Nossa grade funciona assim:",
      "Segundas e quartas: Ballet / Classico / Contemporaneo.",
      "Tercas e quintas: Jazz Kids / Jazz Dance / Danca Moderna.",
      "Sabados: Teatro e musicalizacao. Temos turmas pela manha e tarde."
    ],
    cta: "schedule"
  },
  {
    keywords: ["localizacao", "endereco", "onde fica", "local", "cajazeiras", "mapa", "como chegar"],
    messages: [
      "Estamos na Estr. do Coqueiro Grande, 8.",
      "Fazenda Grande 2 - Salvador/BA.",
      "Fica em frente ao Atacadao de Cajazeiras."
    ],
    cta: "schedule"
  },
  {
    keywords: ["valor", "valores", "preco", "mensalidade", "matricula", "desconto"],
    messages: [
      "A mensalidade e R$ 169,00.",
      "Temos 50% de desconto na matricula.",
      "Aluno matriculado que indica ganha 5% de desconto."
    ],
    cta: "schedule"
  },
  {
    keywords: ["uniforme", "fardamento", "collant", "saia", "tiara"],
    messages: [
      "O fardamento e exclusivo e de uso pessoal.",
      "Valor: R$ 210,00.",
      "Inclui collant, saia, tiara e item promocional."
    ],
    cta: "schedule"
  },
  {
    keywords: ["documento", "documentos", "cpf", "rg", "certidao"],
    messages: [
      "Para matricula, trazer RG ou certidao do aluno.",
      "Tambem CPF do aluno e do responsavel.",
      "Leve comprovante de residencia e declaracao escolar."
    ],
    cta: "schedule"
  },
  {
    keywords: ["modalidade", "ballet", "jazz", "teatro", "musicalizacao", "expressao", "ginastica"],
    messages: [
      "Temos Ballet, Jazz Dance, Danca Moderna e Teatro.",
      "Tambem Musicalizacao Infantil, Expressao Corporal e Ginastica Ritmica.",
      "Se quiser, posso te ajudar a escolher a melhor opcao."
    ],
    cta: "schedule"
  },
  {
    keywords: ["aula teste", "visita", "agendar", "marcar", "experimentar"],
    messages: [
      "Podemos marcar uma visita ou aula teste :)",
      "Assim a equipe avalia a melhor turma para o aluno.",
      "Se quiser, eu ja posso iniciar o agendamento."
    ],
    cta: "schedule"
  }
];

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
  if (age >= 3 && age <= 6) return "Baby Class";
  if (age >= 10 && age <= 13) return "Pre-preparatorio";
  if (age >= 12 && age <= 18) return "Grau";
  if (age >= 3 && age <= 8) return "Iniciacao teatral";
  if (age >= 8 && age <= 13) return "Intermediario";
  if (age >= 14 && age <= 20) return "Avancado";
  return "Avaliacao na aula teste";
}

function getCooldownUntil() {
  return new Date(Date.now() + COOLDOWN_MS).toISOString();
}

function isInCooldown(session) {
  return Boolean(
    session.cooldownUntil && new Date(session.cooldownUntil).getTime() > Date.now()
  );
}

function isMainMenuOption(text) {
  return ["1", "2", "3", "4", "5", "6", "7", "8"].includes(text);
}

function findHelpAnswer(text) {
  for (const rule of HELP_KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule;
    }
  }
  return null;
}

async function sendHelpAnswer(phone, rule) {
  for (const line of rule.messages) {
    await safeSend(() => sendText(phone, line));
  }

  return safeSend(() =>
    sendText(
      phone,
      "Quer que eu inicie o agendamento agora?\n1️⃣ Sim\n2️⃣ Falar com atendente\n3️⃣ Menu"
    )
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
    greeted: true
  });
}

async function finishFlow(phone) {
  return clearSession(phone, {
    state: STATES.MAIN_MENU,
    greeted: true,
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
      "Perfeito! Vamos marcar sua visita/aula teste :)\n\nPrimeiro, me informe o nome e sobrenome do responsavel.\n\n" +
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
          "Nossa grade funciona assim:\n\nSegundas e quartas:\nBallet / Classico / Contemporaneo"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Tercas e quintas:\nJazz Kids / Jazz Dance / Danca Moderna\n\nSabados:\nTeatro e musicalizacao"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Temos turmas pela manha e tarde.\n\nQuer marcar uma visita/aula teste?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "3":
      await safeSend(() =>
        sendText(
          phone,
          "Estamos na:\n\nEstr. do Coqueiro Grande, 8\nFazenda Grande 2 - Salvador/BA"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Em frente ao Atacadao de Cajazeiras.\n\nQuer marcar uma visita?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "4":
      await safeSend(() =>
        sendText(
          phone,
          "Consigo te passar os valores certinho :)\n\nAntes, qual modalidade voce quer?"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "1️⃣ Ballet\n2️⃣ Jazz / Danca Moderna\n3️⃣ Teatro\n4️⃣ Musicalizacao\n5️⃣ Expressao / Ginastica\n6️⃣ Ainda nao sei"
        )
      );
      return updateSession(phone, {
        state: STATES.WAITING_PRICE_MODALITY,
        data: { confirmContext: "values" }
      });
    case "5":
      await safeSend(() =>
        sendText(
          phone,
          "Temos varias modalidades artisticas:\n\nBallet\nJazz Dance\nTeatro"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Musicalizacao Infantil\nGinastica Ritmica\nExpressao Corporal"
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
          "Para matricula, trazer:\n\nRG ou certidao do aluno\nCPF do aluno e responsavel"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Comprovante de residencia\nDeclaracao escolar\nAtestado/relatorio medico, se necessario"
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Quer marcar uma visita antes da matricula?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
        )
      );
      return updateSession(phone, { state: STATES.WAITING_CONFIRM_VISIT });
    case "7":
      await safeSend(() =>
        sendText(phone, "O fardamento e exclusivo da companhia.\n\nValor: R$ 210,00")
      );
      await safeSend(() =>
        sendText(
          phone,
          "Inclui collant, saia, tiara e item promocional.\n\nPode pagar via Pix, cartao ou transferencia."
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
          "Claro :)\n\nMe diga rapidamente qual e a sua duvida."
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
        "Para matricula, trazer:\n\nRG ou certidao do aluno\nCPF do aluno e responsavel"
      )
    );
    await safeSend(() =>
      sendText(
        phone,
        "Comprovante de residencia\nDeclaracao escolar\nAtestado/relatorio medico, se necessario"
      )
    );
    return sendMainMenu(phone, session);
  }

  return sendMainMenu(phone, session);
}

async function handlePriceModality(phone, text) {
  const modality = mapChoice(text, PRICE_MODALITY_OPTIONS);

  if (!modality) {
    return safeSend(() =>
      sendText(phone, "Escolha uma opcao de 1 a 6, por favor.")
    );
  }

  await updateSession(phone, {
    state: STATES.WAITING_CONFIRM_VISIT,
    data: {
      confirmContext: "values",
      priceModality: modality
    }
  });

  await safeSend(() =>
    sendText(
      phone,
      "Nossa mensalidade e R$ 169,00.\n\nNela, o aluno participa das atividades do projeto com acompanhamento artistico."
    )
  );
  await safeSend(() =>
    sendText(
      phone,
      "Tambem temos 50% de desconto na matricula.\n\nAluno matriculado que indica ganha 5% de desconto."
    )
  );

  if (modality === "Ballet") {
    await safeSend(() =>
      sendText(
        phone,
        "No Ballet, o fardamento e exclusivo e de uso pessoal.\n\nEle deve ser solicitado em ate 15 dias apos a matricula."
      )
    );
    await safeSend(() =>
      sendText(
        phone,
        "Valor do fardamento: R$ 210,00.\n\nInclui collant, saia, tiara e item promocional."
      )
    );
  }

  if (modality === "Ainda nao sei") {
    await safeSend(() =>
      sendText(
        phone,
        "Sem problema :)\n\nNa visita, nossa equipe pode te orientar sobre a melhor modalidade."
      )
    );
  }

  return safeSend(() =>
    sendText(
      phone,
      "Quer marcar uma visita/aula teste?\n1️⃣ Sim\n2️⃣ Ver documentos\n3️⃣ Voltar ao menu"
    )
  );
}

async function handleOtherQuestion(phone, incomingText) {
  const normalizedQuestion = normalizeText(incomingText);
  const matchedRule = findHelpAnswer(normalizedQuestion);

  if (!matchedRule) {
    await updateSession(phone, {
      state: STATES.WAITING_ATTENDANT_CONFIRM,
      data: { pendingQuestion: incomingText.trim(), attendantFlowType: "attendant" }
    });

    return safeSend(() =>
      sendText(
        phone,
        "Nao encontrei uma resposta exata por aqui.\n\nQuer falar com um atendente?\n1️⃣ Sim\n2️⃣ Voltar ao menu"
      )
    );
  }

  await updateSession(phone, {
    state: STATES.WAITING_ATTENDANT_CONFIRM,
    data: {
      pendingQuestion: incomingText.trim(),
      suggestedAnswer: matchedRule.messages.join(" "),
      attendantFlowType: matchedRule.cta || "schedule"
    }
  });

  return sendHelpAnswer(phone, matchedRule);
}

async function handleAttendantConfirm(phone, text, session) {
  if (text === "1" || text === "sim") {
    if (session.data.attendantFlowType === "attendant") {
      await safeSend(() =>
        sendInternalNotification(
          formatAttendantSummary({
            phone,
            question: session.data.pendingQuestion || "Cliente pediu atendente."
          }),
          env.attendantNumber
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Certo! Encaminhei sua duvida para um atendente.\n\nAssim que possivel, alguem da equipe vai te responder :)"
        )
      );
      await finishFlow(phone);
      return null;
    }

    return startVisitFlow(phone);
  }

  if (text === "2") {
    if (session.data.attendantFlowType === "attendant") {
      const cleared = await clearSession(phone);
      return sendMainMenu(phone, cleared, true);
    }

    await safeSend(() =>
      sendInternalNotification(
        formatAttendantSummary({
          phone,
          question: session.data.pendingQuestion || "Cliente pediu atendente."
        }),
        env.attendantNumber
      )
    );
    await safeSend(() =>
      sendText(
        phone,
        "Certo! Encaminhei sua duvida para um atendente.\n\nAssim que possivel, alguem da equipe vai te responder :)"
      )
    );
    await finishFlow(phone);
    return null;
  }

  if (text === "3") {
    const cleared = await clearSession(phone);
    return sendMainMenu(phone, cleared, true);
  }

  if (session.data.attendantFlowType === "attendant") {
    return safeSend(() =>
      sendText(phone, "Me responda com:\n1️⃣ Sim\n2️⃣ Voltar ao menu")
    );
  }

  return safeSend(() =>
    sendText(
      phone,
      "Me responda com:\n1️⃣ Sim\n2️⃣ Falar com atendente\n3️⃣ Menu"
    )
  );
}

async function handleMessage(phone, incomingText) {
  const text = normalizeText(incomingText);
  let session = await getSession(phone);

  if (isResetCommand(text)) {
    session = await clearSession(phone);
    return sendMainMenu(phone, session, true);
  }

  if (!session.greeted) {
    await sendMainMenu(phone, session, true);
    return null;
  }

  if (isInCooldown(session) && session.state === STATES.MAIN_MENU) {
    if (!isMainMenuOption(text)) {
      return null;
    }

    await updateSession(phone, { cooldownUntil: null });
    session = await getSession(phone);
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
          sendText(phone, "Me informe apenas a idade em numero, por favor.")
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
          "Certo! Pela idade, vamos indicar o grupo mais adequado apos a aula teste."
        )
      );

      return safeSend(() =>
        sendText(
          phone,
          "Qual modalidade tem mais interesse?\n\n1️⃣ Ballet\n2️⃣ Jazz / Danca Moderna\n3️⃣ Teatro\n4️⃣ Musicalizacao\n5️⃣ Expressao corporal\n6️⃣ Ainda nao sei"
        )
      );
    }
    case STATES.WAITING_MODALITY: {
      const modality = mapChoice(text, MODALITY_OPTIONS);

      if (!modality) {
        return safeSend(() =>
          sendText(phone, "Escolha uma opcao de 1 a 6, por favor.")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_SHIFT,
        data: { modality }
      });

      return safeSend(() =>
        sendText(
          phone,
          "Qual turno seria melhor?\n\n1️⃣ Manha\n2️⃣ Tarde\n3️⃣ Sabado\n4️⃣ Ainda nao sei"
        )
      );
    }
    case STATES.WAITING_SHIFT: {
      const shift = mapChoice(text, SHIFT_OPTIONS);

      if (!shift) {
        return safeSend(() =>
          sendText(phone, "Escolha uma opcao de 1 a 4, por favor.")
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
          "Como voce conheceu a Cia. Renato Torres?\n\n1️⃣ Instagram\n2️⃣ Indicacao\n3️⃣ WhatsApp\n4️⃣ Passando pelo local\n5️⃣ Outro"
        )
      );
    case STATES.WAITING_ORIGIN: {
      const origin = mapChoice(text, ORIGIN_OPTIONS);

      if (!origin) {
        return safeSend(() =>
          sendText(phone, "Escolha uma opcao de 1 a 5, por favor.")
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
          "Pronto! Sua solicitacao foi registrada :)\n\nNossa equipe vai conferir a agenda e confirmar o melhor horario."
        )
      );
      await safeSend(() =>
        sendText(
          phone,
          "Cia. Renato Torres\nEstr. do Coqueiro Grande, 8\nEm frente ao Atacadao de Cajazeiras"
        )
      );
      await safeSend(() => sendInternalNotification(formatLeadSummary(lead)));
      await finishFlow(phone);
      return null;
    }
    case STATES.WAITING_OTHER_QUESTION:
      return handleOtherQuestion(phone, incomingText);
    case STATES.WAITING_ATTENDANT_CONFIRM:
      return handleAttendantConfirm(phone, text, session);
    case STATES.WAITING_CONFIRM_VISIT:
      return handleConfirmVisit(phone, text, session);
    case STATES.WAITING_PRICE_MODALITY:
      return handlePriceModality(phone, text);
    default:
      session = await clearSession(phone);
      return sendMainMenu(phone, session, true);
  }
}

module.exports = {
  handleMessage
};
