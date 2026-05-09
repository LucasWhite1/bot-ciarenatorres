const env = require("../config/env");
const {
  STATES,
  getSession,
  updateSession,
  clearSession
} = require("../stores/sessionStore");
const {
  sendText,
  sendInternalNotification
} = require("../services/evolutionService");
const normalizeText = require("../utils/normalizeText");
const {
  formatLeadSummary,
  formatAttendantSummary
} = require("../utils/leadFormatter");

const MENU_HINT = '🔁 Para voltar ao menu, digite "Menu".';

const LOCATION_MESSAGE = [
  "📍 *LOCALIZAÇÃO*",
  "",
  "Estr. do Coqueiro Grande, 8",
  "Fazenda Grande 2 - Salvador/BA",
  "",
  "Referência: em frente ao Atacadão de Cajazeiras."
].join("\n");

const COMPANY_PRESENTATION = [
  "🌟 *QUEM SOMOS*",
  "",
  "Uma escola atuante há mais de 10 anos em Salvador.",
  "",
  "Com foco principal na participação direta dos alunos em diversas modalidades artísticas.",
  "",
  "Nosso projeto reúne modalidades diversas dentro de uma proposta multidisciplinar.",
  "",
  "Incluindo:",
  "• Ballet",
  "• Jazz",
  "• Teatro",
  "• Musicalização",
  "• Técnicas e habilidades corporais",
  "• E muito mais",
  "",
  "Você entendeu nossa proposta?",
  "",
  "1 - Sim",
  "2 - Não"
].join("\n");

const DOCUMENTS_MESSAGE = [
  "📄 *DOCUMENTAÇÃO PARA MATRÍCULA*",
  "",
  "A matrícula deverá ser realizada em nossa companhia, munidos dos seguintes documentos:",
  "",
  "• RG (Registro Geral) do aluno e do responsável.",
  "Em caso da falta do RG do aluno, pode ser apresentada a certidão de nascimento.",
  "",
  "• CPF (Cadastro de Pessoas Físicas) do aluno e do responsável.",
  "",
  "• Comprovante de residência.",
  "",
  "• Atestado / relatório médico de competência.",
  "Em caso de recomendação ou observação médica necessária.",
  "",
  "• Declaração escolar.",
  "Aplica-se aos alunos acima de 3 anos de idade matriculados em unidade de ensino regular.",
  "",
  MENU_HINT
].join("\n");

const UNIFORM_MESSAGE = [
  "🩰 *FARDAMENTOS (UNIFORMES)*",
  "",
  "Confecção exclusiva, composta de material qualificado e confortável, confeccionado por empresas parceiras.",
  "",
  "Pode ser adquirido na própria companhia no valor de R$ 210,00.",
  "Em caso de aquisição, pode ser parcelado no cartão de crédito ou pago via Pix, transferência e outras transações bancárias.",
  "",
  "Cores:",
  "• Rosa - Baby Class",
  "• Roxo - Pré-preparatório",
  "• Preto - Graus",
  "",
  MENU_HINT
].join("\n");

const INVESTMENT_MESSAGE = [
  "💰 *INVESTIMENTO MENSAL*",
  "",
  "O investimento mensal é de R$ 169,00.",
  "",
  "Estão inclusas todas as modalidades da grade, ou seja, o aluno fará todas as aulas por um valor único.",
  "",
  MENU_HINT
].join("\n");

const BUSINESS_HOURS_MESSAGE = [
  "🕘 *DIAS E HORÁRIOS DE FUNCIONAMENTO*",
  "",
  "Segunda a sexta: 8h às 17h",
  "Sábado: 8h às 13h",
  "",
  MENU_HINT
].join("\n");

const MAIN_MENU_MESSAGE = [
  "✨ *VAMOS FAZER ASSIM...*",
  "Agora diga-nos o que deseja:",
  "",
  "1 - Fazer visita",
  "2 - Localização",
  "3 - Documentos para matrícula",
  "4 - Agendar aula teste",
  "5 - Dias e horários de funcionamento",
  "6 - Sobre o uniforme",
  "7 - Investimento mensal",
  "8 - Falar com a secretaria",
  "9 - Nosso Instagram",
  "",
  MENU_HINT
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
  "1": "manhã",
  "2": "tarde",
  manha: "manhã",
  manhã: "manhã",
  tarde: "tarde"
};

const WEEKDAY_OPTIONS = {
  "1": "segunda",
  "2": "terça",
  "3": "quarta",
  "4": "quinta",
  "5": "sexta",
  "6": "sábado",
  segunda: "segunda",
  "segunda-feira": "segunda",
  terca: "terça",
  "terca-feira": "terça",
  terça: "terça",
  "terça-feira": "terça",
  quarta: "quarta",
  "quarta-feira": "quarta",
  quinta: "quinta",
  "quinta-feira": "quinta",
  sexta: "sexta",
  "sexta-feira": "sexta",
  sabado: "sábado",
  sábado: "sábado"
};

const DAY_MENU_MESSAGE = [
  "📅 *QUAL DIA DA SEMANA?*",
  "",
  "1 - Segunda",
  "2 - Terça",
  "3 - Quarta",
  "4 - Quinta",
  "5 - Sexta",
  "6 - Sábado",
  "",
  "Você pode responder com o número ou com o nome do dia.",
  "",
  MENU_HINT
].join("\n");

function getAvailableDays(modality) {
  if (modality === "Ballet") {
    return ["terça", "quinta"];
  }

  if (modality === "Jazz / Dança Moderna") {
    return ["segunda", "quarta"];
  }

  if (["Teatro", "Musicalização"].includes(modality)) {
    return ["sábado"];
  }

  return ["segunda", "terça", "quarta", "quinta"];
}

function buildDayMenuMessage(modality) {
  const availableDays = getAvailableDays(modality);
  const dayLabels = {
    segunda: "Segunda",
    "terça": "Terça",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    "sábado": "Sábado"
  };

  return [
    `📅 *DIAS DISPONÍVEIS PARA ${modality.toUpperCase()}*`,
    "",
    ...availableDays.map((day, index) => `${index + 1} - ${dayLabels[day]}`),
    "",
    "Você pode responder com o número ou com o nome do dia.",
    "",
    MENU_HINT
  ].join("\n");
}

async function safeSend(callback) {
  try {
    await callback();
  } catch (error) {
    console.error("Failed to send message:", error.response?.data || error.message);
  }
}

function isMenuCommand(text) {
  return text === "menu";
}

function isRestartCommand(text) {
  return text === "reiniciar";
}

function mapChoice(input, options) {
  return options[input] || null;
}

function getCooldownUntil() {
  return new Date(Date.now() + env.menuCooldownMinutes * 60 * 1000).toISOString();
}

function isInCooldown(session) {
  return Boolean(
    session.cooldownUntil && new Date(session.cooldownUntil).getTime() > Date.now()
  );
}

function getGreetingPeriod() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo"
    }).format(new Date())
  );

  if (hour >= 5 && hour < 12) {
    return "Bom dia";
  }

  if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

function getAgeGroup(age) {
  if (age >= 3 && age <= 7) {
    return "Baby Class";
  }

  if (age >= 8 && age <= 12) {
    return "Pré-preparatório";
  }

  if (age >= 13 && age <= 20) {
    return "Graus";
  }

  return null;
}

function getWeekdayLabel(day) {
  const labels = {
    segunda: "segunda-feira",
    "terça": "terça-feira",
    quarta: "quarta-feira",
    quinta: "quinta-feira",
    sexta: "sexta-feira",
    "sábado": "sábado"
  };

  return labels[day] || day;
}

function buildIntroMessage() {
  return [
    `👋 Olá, ${getGreetingPeriod()}! Sou o atendente virtual Nill. Vamos continuar com a nossa conversa?`,
    "",
    "1 - Sim",
    "2 - Não"
  ].join("\n");
}

async function sendMainMenu(phone) {
  await safeSend(() => sendText(phone, MAIN_MENU_MESSAGE));

  return updateSession(phone, {
    state: STATES.MAIN_MENU,
    greeted: true
  });
}

async function sendIntroduction(phone) {
  await updateSession(phone, {
    state: STATES.WAITING_INTRO_CONFIRM,
    greeted: true,
    data: {}
  });

  return safeSend(() => sendText(phone, buildIntroMessage()));
}

async function startSchedulingFlow(phone, purpose) {
  await updateSession(phone, {
    state: STATES.WAITING_MODALITY,
    data: {
      schedulingPurpose: purpose
    }
  });

  return safeSend(() =>
    sendText(
      phone,
      [
        "🎯 *CERTO! QUAL MODALIDADE TEM MAIS INTERESSE?*",
        "",
        "1 - Ballet",
        "2 - Jazz / Dança Moderna",
        "3 - Teatro",
        "4 - Musicalização",
        "5 - Expressão corporal",
        "6 - Ainda não sei",
        "",
        MENU_HINT
      ].join("\n")
    )
  );
}

function resolveSchedule({ modality, shift, weekday, age }) {
  const ageGroup = getAgeGroup(age);

  if (!ageGroup && !["Teatro", "Musicalização"].includes(modality)) {
    return {
      ok: false,
      message:
        "Não consegui encaixar automaticamente essa idade na grade. Vou precisar que a secretaria confirme o melhor horário."
    };
  }

  if (weekday === "sexta") {
    return {
      ok: false,
      message:
        "Na sexta trabalhamos com planejamentos agendados ou reposições. Escolha outro dia da semana para eu te sugerir um horário."
    };
  }

  if (modality === "Ballet" && !["terça", "quinta"].includes(weekday)) {
    return {
      ok: false,
      message: "Para Ballet, os dias disponíveis são terça e quinta. Escolha uma dessas opções:"
    };
  }

  if (modality === "Jazz / Dança Moderna" && !["segunda", "quarta"].includes(weekday)) {
    return {
      ok: false,
      message: "Para Jazz / Dança Moderna, os dias disponíveis são segunda e quarta. Escolha uma dessas opções:"
    };
  }

  if (["Teatro", "Musicalização"].includes(modality)) {
    if (weekday !== "sábado") {
      return {
        ok: false,
        message: `Para ${modality}, o dia disponível é o sábado. Escolha essa opção para continuar.`
      };
    }

    if (shift !== "manhã") {
      return {
        ok: false,
        message: `Para ${modality}, no momento temos horários de sábado pela manhã.`
      };
    }

    if (age >= 3 && age <= 7) {
      return {
        ok: true,
        scheduleText: `${getWeekdayLabel(weekday)}, das 8h às 9h`,
        classLabel: "Iniciação",
        ageGroupLabel: "3 a 7 anos"
      };
    }

    if (age >= 8 && age <= 13) {
      return {
        ok: true,
        scheduleText: `${getWeekdayLabel(weekday)}, das 9h às 10h30`,
        classLabel: "Intermediário",
        ageGroupLabel: "8 a 13 anos"
      };
    }

    return {
      ok: false,
      message: `Para ${modality}, preciso que a secretaria confirme o melhor encaixe para essa idade.`
    };
  }

  if (weekday === "sábado") {
    return {
      ok: false,
      message: "O sábado está reservado para Teatro e Musicalização. Escolha de segunda a quinta para continuar."
    };
  }

  if (shift === "manhã") {
    if (ageGroup === "Graus") {
      return {
        ok: true,
        scheduleText: `${getWeekdayLabel(weekday)}, das 8h às 9h`,
        classLabel: "Graus",
        ageGroupLabel: "13 a 20 anos"
      };
    }

    if (ageGroup === "Baby Class") {
      return {
        ok: true,
        scheduleText: `${getWeekdayLabel(weekday)}, das 9h às 10h`,
        classLabel: "Baby Class",
        ageGroupLabel: "3 a 7 anos"
      };
    }

    return {
      ok: true,
      scheduleText: `${getWeekdayLabel(weekday)}, das 9h às 10h`,
      classLabel: "Pré-preparatório",
      ageGroupLabel: "8 a 12 anos"
    };
  }

  if (ageGroup === "Graus") {
    return {
      ok: true,
      scheduleText: `${getWeekdayLabel(weekday)}, das 14h às 15h`,
      classLabel: "Graus",
      ageGroupLabel: "13 a 20 anos"
    };
  }

  if (ageGroup === "Baby Class") {
    return {
      ok: true,
      scheduleText: `${getWeekdayLabel(weekday)}, das 15h às 16h`,
      classLabel: "Baby Class",
      ageGroupLabel: "3 a 7 anos"
    };
  }

  return {
    ok: true,
    scheduleText: `${getWeekdayLabel(weekday)}, das 16h às 17h`,
    classLabel: "Pré-preparatório",
    ageGroupLabel: "8 a 12 anos"
  };
}

async function notifyLead(phone, session, scheduleConfirmed) {
  await safeSend(() =>
    sendInternalNotification(
      formatLeadSummary({
        ...session.data,
        phone,
        scheduleConfirmed: scheduleConfirmed ? "Sim" : "Não"
      })
    )
  );
}

async function finalizeScheduling(phone, session, scheduleConfirmed) {
  if (scheduleConfirmed) {
    await safeSend(() =>
      sendText(
        phone,
        "✅ Perfeito! Registrei seu interesse e encaminhei para nossa equipe."
      )
    );
  } else {
    await safeSend(() =>
      sendText(
        phone,
        "📌 Sem problema! Vou encaminhar para a secretaria confirmar outro horário com você."
      )
    );
  }

  await safeSend(() => sendText(phone, LOCATION_MESSAGE));
  await notifyLead(phone, session, scheduleConfirmed);

  await updateSession(phone, {
    state: STATES.MAIN_MENU,
    greeted: true,
    cooldownUntil: getCooldownUntil()
  });

  return null;
}

async function handleMainMenu(phone, text) {
  switch (text) {
    case "1":
      return startSchedulingFlow(phone, "Fazer visita");
    case "2":
      return safeSend(() => sendText(phone, `${LOCATION_MESSAGE}\n\n${MENU_HINT}`));
    case "3":
      return safeSend(() => sendText(phone, DOCUMENTS_MESSAGE));
    case "4":
      return startSchedulingFlow(phone, "Agendar aula teste");
    case "5":
      return safeSend(() => sendText(phone, BUSINESS_HOURS_MESSAGE));
    case "6":
      return safeSend(() => sendText(phone, UNIFORM_MESSAGE));
    case "7":
      return safeSend(() => sendText(phone, INVESTMENT_MESSAGE));
    case "8":
      await updateSession(phone, {
        state: STATES.WAITING_OTHER_QUESTION
      });
      return safeSend(() =>
        sendText(phone, "💬 Claro! Me diga rapidamente qual é a sua dúvida.")
      );
    case "9":
      return safeSend(() =>
        sendText(phone, `📲 Nosso Instagram:\nhttps://www.instagram.com/ciarenatotorres/\n\n${MENU_HINT}`)
      );
    default:
      return safeSend(() =>
        sendText(phone, '⚠️ Responda com uma opção de 1 a 9 ou digite "Menu".')
      );
  }
}

async function handleOtherQuestion(phone, incomingText) {
  await updateSession(phone, {
    state: STATES.WAITING_ATTENDANT_CONFIRM,
    data: {
      pendingQuestion: incomingText.trim()
    }
  });

  return safeSend(() =>
    sendText(
      phone,
      "📨 Deseja que eu encaminhe essa dúvida para a secretaria?\n\n1 - Sim\n2 - Não"
    )
  );
}

async function handleAttendantConfirm(phone, text, session) {
  if (text === "1" || text === "sim") {
    await safeSend(() =>
      sendInternalNotification(
        formatAttendantSummary({
          phone,
          question: session.data.pendingQuestion || "Cliente pediu secretaria."
        })
      )
    );

    await safeSend(() =>
      sendText(
        phone,
        "✅ Pronto! Encaminhei sua mensagem para a secretaria. Assim que possível, a equipe vai falar com você."
      )
    );

    return null;
  }

  if (text === "2" || text === "nao") {
    return sendMainMenu(phone);
  }

  return safeSend(() =>
    sendText(phone, "Me responda com:\n1 - Sim\n2 - Não")
  );
}

async function handleMessage(phone, incomingText) {
  const text = normalizeText(incomingText);
  let session = await getSession(phone);

  if (isRestartCommand(text)) {
    await clearSession(phone, {
      state: STATES.MAIN_MENU,
      greeted: false,
      data: {}
    });
    return sendIntroduction(phone);
  }

  if (isMenuCommand(text)) {
    await clearSession(phone, {
      state: STATES.MAIN_MENU,
      greeted: true,
      cooldownUntil: null,
      data: {}
    });
    return sendMainMenu(phone);
  }

  if (isInCooldown(session)) {
    return null;
  }

  if (session.cooldownUntil) {
    await clearSession(phone, {
      state: STATES.MAIN_MENU,
      greeted: false,
      cooldownUntil: null,
      data: {}
    });
    return sendIntroduction(phone);
  }

  if (!session.greeted) {
    return sendIntroduction(phone);
  }

  switch (session.state) {
    case STATES.WAITING_INTRO_CONFIRM:
      await updateSession(phone, {
        state: STATES.WAITING_RESPONSIBLE_NAME,
        data: {
          introAnswer: text === "1" || text === "sim" ? "Sim" : "Não"
        }
      });
      return safeSend(() =>
        sendText(
          phone,
          `✨ Vamos lá! Antes, diga-nos o nome e o sobrenome do responsável.\n\n${MENU_HINT}`
        )
      );
    case STATES.WAITING_RESPONSIBLE_NAME:
      await updateSession(phone, {
        state: STATES.WAITING_STUDENT_NAME,
        data: {
          responsibleName: incomingText.trim()
        }
      });
      return safeSend(() =>
        sendText(phone, `👤 Agora, o nome e o sobrenome do aluno.\n\n${MENU_HINT}`)
      );
    case STATES.WAITING_STUDENT_NAME:
      await updateSession(phone, {
        state: STATES.WAITING_STUDENT_AGE,
        data: {
          studentName: incomingText.trim()
        }
      });
      return safeSend(() =>
        sendText(phone, `🎂 Agora me informe a idade.\n\n${MENU_HINT}`)
      );
    case STATES.WAITING_STUDENT_AGE: {
      const age = Number(incomingText.replace(/\D/g, ""));

      if (!age) {
        return safeSend(() =>
          sendText(phone, "⚠️ Informe apenas a idade em número, por favor.")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_KNOWS_COMPANY,
        data: {
          studentAge: age
        }
      });

      const responsibleName = session.data.responsibleName || "responsável";
      return safeSend(() =>
        sendText(
          phone,
          `🤝 Prazer, ${responsibleName}!\nVocê já conhece nossa companhia?\n\n1 - Sim\n2 - Não`
        )
      );
    }
    case STATES.WAITING_KNOWS_COMPANY:
      if (!["1", "2", "sim", "nao"].includes(text)) {
        return safeSend(() =>
          sendText(phone, "Me responda com:\n1 - Sim\n2 - Não")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_PROPOSAL_CONFIRM,
        data: {
          knowsCompany: text === "1" || text === "sim" ? "Sim" : "Não"
        }
      });

      return safeSend(() => sendText(phone, COMPANY_PRESENTATION));
    case STATES.WAITING_PROPOSAL_CONFIRM:
      if (!["1", "2", "sim", "nao"].includes(text)) {
        return safeSend(() =>
          sendText(phone, "Me responda com:\n1 - Sim\n2 - Não")
        );
      }

      await updateSession(phone, {
        data: {
          understoodProposal: text === "1" || text === "sim" ? "Sim" : "Não"
        }
      });

      return sendMainMenu(phone);
    case STATES.MAIN_MENU:
      return handleMainMenu(phone, text);
    case STATES.WAITING_MODALITY: {
      const modality = mapChoice(text, MODALITY_OPTIONS);

      if (!modality) {
        return safeSend(() =>
          sendText(phone, "⚠️ Escolha uma opção de 1 a 6, por favor.")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_SHIFT,
        data: {
          modality
        }
      });

      return safeSend(() =>
        sendText(
          phone,
          `🕘 *QUAL PERÍODO DESEJA?*\n\n1 - Manhã\n2 - Tarde\n\n${MENU_HINT}`
        )
      );
    }
    case STATES.WAITING_SHIFT: {
      const shift = mapChoice(text, SHIFT_OPTIONS);

      if (!shift) {
        return safeSend(() =>
          sendText(phone, "⚠️ Responda com 1 ou 2.\n\n1 - Manhã\n2 - Tarde")
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_VISIT_DAY,
        data: {
          shift
        }
      });

      return safeSend(() => sendText(phone, buildDayMenuMessage(session.data.modality)));
    }
    case STATES.WAITING_VISIT_DAY: {
      const availableDays = getAvailableDays(session.data.modality);
      const numericDayOptions = Object.fromEntries(
        availableDays.map((day, index) => [String(index + 1), day])
      );
      const weekday =
        mapChoice(text, numericDayOptions) ||
        (availableDays.includes(mapChoice(text, WEEKDAY_OPTIONS))
          ? mapChoice(text, WEEKDAY_OPTIONS)
          : null);

      if (!weekday) {
        return safeSend(() =>
          sendText(
            phone,
            `⚠️ Escolha um dia válido.\n\n${buildDayMenuMessage(session.data.modality)}`
          )
        );
      }

      const modality = session.data.modality;
      const shift = session.data.shift;
      const age = Number(session.data.studentAge);
      const schedule = resolveSchedule({ modality, shift, weekday, age });

      if (!schedule.ok) {
        return safeSend(() =>
          sendText(
            phone,
            `${schedule.message}\n\n${buildDayMenuMessage(session.data.modality)}`
          )
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_SCHEDULE_CONFIRM,
        data: {
          preferredDay: weekday,
          suggestedSchedule: schedule.scheduleText,
          suggestedClassLabel: schedule.classLabel,
          suggestedAgeGroup: schedule.ageGroupLabel
        }
      });

      return safeSend(() =>
        sendText(
          phone,
          [
            `📌 Pela idade do aluno, a melhor sugestão para *${modality}* é:`,
            "",
            `Turma: ${schedule.classLabel}`,
            `Faixa etária: ${schedule.ageGroupLabel}`,
            `Horário: ${schedule.scheduleText}`,
            "",
            "Esse horário funciona para você?",
            "",
            "1 - Sim",
            "2 - Não"
          ].join("\n")
        )
      );
    }
    case STATES.WAITING_SCHEDULE_CONFIRM:
      if (text === "1" || text === "sim") {
        session = await getSession(phone);
        return finalizeScheduling(phone, session, true);
      }

      if (text === "2" || text === "nao") {
        session = await getSession(phone);
        return finalizeScheduling(phone, session, false);
      }

      return safeSend(() =>
        sendText(phone, "Me responda com:\n1 - Sim\n2 - Não")
      );
    case STATES.WAITING_OTHER_QUESTION:
      return handleOtherQuestion(phone, incomingText);
    case STATES.WAITING_ATTENDANT_CONFIRM:
      return handleAttendantConfirm(phone, text, session);
    default:
      await clearSession(phone, {
        state: STATES.MAIN_MENU,
        greeted: false,
        data: {}
      });
      return sendIntroduction(phone);
  }
}

module.exports = {
  handleMessage
};
