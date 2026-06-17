const env = require("../config/env");
const path = require("path");
const {
  STATES,
  getSession,
  updateSession,
  clearSession
} = require("../stores/sessionStore");
const {
  sendText,
  sendImageFromFile,
  sendInternalNotification
} = require("../services/evolutionService");
const normalizeText = require("../utils/normalizeText");
const {
  formatLeadSummary,
  formatAttendantSummary
} = require("../utils/leadFormatter");

const MENU_HINT = '🔁 Para voltar ao menu, digite "Menu".';
const BINARY_CHOICE_HINT =
  'Se preferir, digite "Menu" para voltar ao menu principal.';
const INACTIVITY_RESET_MS = 60 * 60 * 1000;
const NILL_IMAGE_PATH =
  path.resolve(__dirname, "../../assets/images/nill-atendente.png");
const WHO_WE_ARE_IMAGE_PATH =
  path.resolve(__dirname, "../../assets/images/quem-somos.png");
const TRIAL_CLASS_IMAGE_PATH =
  path.resolve(__dirname, "../../assets/images/aula-teste.png");
const MENU_IMAGE_PATH =
  path.resolve(__dirname, "../../assets/images/menu-principal.png");

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
  "• E muito mais"
].join("\n");

const COMPANY_PRESENTATION_CONFIRM = buildBinaryChoiceMessage(
  "Você entendeu nossa proposta?"
);

const TRIAL_CLASS_MENU_MESSAGE = [
  "🎭 *AULA TESTE*",
  "",
  "O aluno será avaliado pelo profissional do dia, através das práticas e entendimento, para ser encaminhado à turma mais adequada ao seu desenvolvimento.",
  "",
  "Vamos agendar a aula teste?"
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

const KNOWLEDGE_BASE = [
  {
    topic: "mensalidade",
    keywords: [
      "valor",
      "valores",
      "mensalidade",
      "mensal",
      "matricula",
      "matricula",
      "preco",
      "custa",
      "boleto",
      "pagamento",
      "banco do brasil",
      "dinheiro"
    ],
    response: [
      "💰 *MENSALIDADE E MATRÍCULA*",
      "",
      "Inicialmente a mensalidade está no valor de *R$ 169,00*.",
      "",
      "O aluno matriculado em uma das modalidades terá em seu currículo as demais modalidades disponíveis, como Ballet, Jazz, Teatro, Dança Moderna, Musicalização e outras expressões.",
      "",
      "As mensalidades podem ser realizadas no formato de boletos bancários com convênio do Banco do Brasil.",
      "",
      "Por questões de segurança dos nossos alunos e colaboradores, *não recebemos valores em dinheiro* na companhia."
    ].join("\n")
  },
  {
    topic: "documentacao",
    keywords: [
      "documento",
      "documentos",
      "rg",
      "cpf",
      "certidao",
      "certidão",
      "comprovante",
      "declaracao escolar",
      "declaração escolar",
      "atestado",
      "relatorio medico",
      "relatório médico"
    ],
    response: DOCUMENTS_MESSAGE
  },
  {
    topic: "uniforme",
    keywords: [
      "uniforme",
      "uniformes",
      "fardamento",
      "fardamentos",
      "collant",
      "saia",
      "tiara",
      "rosa",
      "roxo",
      "preto"
    ],
    response: [
      "🩰 *FARDAMENTOS (UNIFORMES)*",
      "",
      "O fardamento é exclusivo e de uso pessoal, podendo ser adquirido na própria companhia.",
      "",
      "Ele deverá ser solicitado no prazo máximo de até 15 dias após a matrícula do aluno.",
      "",
      "Valor: *R$ 210,00*.",
      "Compondo a base com: collant, saia, tiara e item promocional.",
      "",
      "Também temos a confecção exclusiva com material qualificado e confortável, podendo ser parcelado no cartão de crédito ou pago via Pix, transferências e outras transações bancárias.",
      "",
      "Cores de referência: Rosa, Roxo e Preto."
    ].join("\n")
  },
  {
    topic: "funcionamento",
    keywords: [
      "horario de funcionamento",
      "horario administrativo",
      "atendimento",
      "funcionamento",
      "horario",
      "horarios",
      "abre",
      "fecha"
    ],
    response: [
      "🕘 *HORÁRIO DE FUNCIONAMENTO (ATENDIMENTO AO PÚBLICO)*",
      "",
      "Nosso horário administrativo funciona das *8h às 18h*, de segunda a sexta.",
      "",
      "Aos sábados, funcionamos das *9h às 16h*."
    ].join("\n")
  },
  {
    topic: "agenda",
    keywords: [
      "agenda",
      "grade",
      "dias de aula",
      "horario de aula",
      "horarios das aulas",
      "turma",
      "turno",
      "manha",
      "manhã",
      "tarde",
      "sabado",
      "sábado"
    ],
    response: [
      "📚 *AGENDA SEMANAL*",
      "",
      "Para definir os horários das aulas, é importante entendermos a idade do aluno, sua disponibilidade e também sua experiência artística.",
      "",
      "Nossa grade funciona assim:",
      "• Segundas e quartas: Ballet Clássico e Contemporâneo",
      "• Terças e quintas: Jazz Kids / Jazz Dance / Dança Moderna",
      "• Sábados: Iniciação teatral / Teatro intermediário",
      "",
      "Temos turnos de manhã e tarde, e as sextas-feiras funcionam como base de resoluções administrativas e reposições."
    ].join("\n")
  },
  {
    topic: "aula_teste",
    keywords: [
      "aula teste",
      "aula experimental",
      "experimental",
      "avaliacao",
      "avaliação",
      "grupo especifico",
      "grupo específico"
    ],
    response: [
      "🎭 *AULA TESTE*",
      "",
      "O aluno será avaliado pelo profissional do dia, através das práticas e entendimento, a fim de conhecê-lo e encaminhá-lo para seu grupo específico.",
      "",
      "Exemplo: se o aluno tem 3 anos, fará aulas apenas no grupo da sua idade, como o Baby Class.",
      "",
      "Se o aluno já tiver alguma prática ou base em qualquer uma das modalidades, ele poderá ser encaminhado imediatamente para seu grupo específico, obedecendo os critérios avaliativos."
    ].join("\n")
  },
  {
    topic: "vestimenta",
    keywords: [
      "vestimenta",
      "roupa",
      "coque",
      "rabo de cavalo",
      "garrafinha",
      "agua",
      "água",
      "legging",
      "alcool gel",
      "álcool gel"
    ],
    response: [
      "👕 *VESTIMENTA PARA A AULA TESTE*",
      "",
      "Solicitamos que o aluno venha com roupa confortável, como calça legging, blusinha de algodão ou collant, além de uma meia comum de algodão.",
      "",
      "Manter os cabelos em formato de coque para Ballet e rabo de cavalo para Jazz e outras modalidades.",
      "",
      "Também orientamos portar sua própria garrafinha d'água e álcool gel.",
      "",
      "Observação: a vestimenta não deve conter botões, fivelas, cintos embutidos, brincos ou cordões."
    ].join("\n")
  },
  {
    topic: "agendamento",
    keywords: [
      "agendar",
      "agendamento",
      "visita",
      "conhecer",
      "marcar",
      "aula experimental",
      "aula teste"
    ],
    response: [
      "📅 *AGENDAMENTO / AULA TESTE*",
      "",
      "Esse primeiro contato do aluno com a modalidade e com nossos professores é muito importante.",
      "",
      "Nele, o aluno passará por algumas avaliações e receberá o encaminhamento para seu grupo específico.",
      "",
      "Se preferir, também podemos agendar uma visita para você conhecer a companhia mais de perto."
    ].join("\n")
  }
];

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

  const title =
    modality && modality !== "Ainda não sei"
      ? `📅 *DIAS DISPONÍVEIS PARA ${modality.toUpperCase()}*`
      : "📅 *DIAS DISPONÍVEIS*";

  return [
    title,
    "",
    ...availableDays.map((day, index) => `${index + 1} - ${dayLabels[day]}`),
    "",
    "Você pode responder com o número ou com o nome do dia.",
    "",
    MENU_HINT
  ].join("\n");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function findKnowledgeBaseEntry(text) {
  return (
    KNOWLEDGE_BASE.find((entry) =>
      entry.keywords.some((keyword) => text.includes(normalizeText(keyword)))
    ) || null
  );
}

function getCooldownUntil() {
  return new Date(Date.now() + env.menuCooldownMinutes * 60 * 1000).toISOString();
}

function isInCooldown(session) {
  return Boolean(
    session.cooldownUntil && new Date(session.cooldownUntil).getTime() > Date.now()
  );
}

function hasSessionExpired(session) {
  if (!session?.lastInteractionAt) {
    return false;
  }

  return Date.now() - new Date(session.lastInteractionAt).getTime() >= INACTIVITY_RESET_MS;
}

function buildBinaryChoiceMessage(question, options = ["1 - Sim", "2 - Não"]) {
  return [question, "", ...options, "", BINARY_CHOICE_HINT].join("\n");
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
  return buildBinaryChoiceMessage(
    `👋 Olá, ${getGreetingPeriod()}! Sou o atendente virtual Nill. Vamos continuar com a nossa conversa?`,
    ["1 - Sim", "2 - Não", "3 - Área do responsável"]
  );
}

async function sendMainMenu(phone) {
  await safeSend(() => sendImageFromFile(phone, MENU_IMAGE_PATH, MAIN_MENU_MESSAGE));

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

  return safeSend(() => sendImageFromFile(phone, NILL_IMAGE_PATH, buildIntroMessage()));
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
  const ageGroup =
    modality === "Ballet"
      ? getAgeGroup(age)
      : age >= 13
        ? "Graus"
        : getAgeGroup(age);

  if (weekday === "sexta") {
    return {
      ok: false,
      message:
        "Na sexta trabalhamos com planejamentos agendados ou reposições. Escolha outro dia da semana para eu te sugerir um horário."
    };
  }

  if (modality === "Ainda não sei") {
    const scheduleText =
      shift === "manhã"
        ? `${getWeekdayLabel(weekday)}, no período da manhã`
        : `${getWeekdayLabel(weekday)}, no período da tarde`;

    return {
      ok: true,
      scheduleText,
      classLabel: "Visita para conhecer",
      ageGroupLabel: age ? `${age} anos` : "Não informado"
    };
  }

  if (!ageGroup && modality === "Ballet") {
    return {
      ok: false,
      handoffToAttendant: true,
      message:
        "No momento não encontramos vaga disponível para essa idade nessa modalidade. Vou encaminhar seu atendimento para a secretaria verificar o que pode ser feito."
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

    if (age >= 8) {
      return {
        ok: true,
        scheduleText: `${getWeekdayLabel(weekday)}, das 9h às 10h30`,
        classLabel: "Intermediário",
        ageGroupLabel: "8 anos ou mais"
      };
    }
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

async function handoffScheduleByAge(phone, session, modality) {
  await safeSend(() =>
    sendText(
      phone,
      `⚠️ No momento não encontramos vaga disponível para essa idade em *${modality}*.\n\nVou encaminhar seu atendimento para a secretaria verificar o que pode ser feito.`
    )
  );

  await safeSend(() =>
    sendInternalNotification(
      formatAttendantSummary({
        phone,
        question:
          `Cliente sem encaixe automático por idade. Modalidade: ${session.data.modality || "não informada"}. ` +
          `Idade: ${session.data.studentAge || "não informada"}. ` +
          `Período: ${session.data.shift || "não informado"}. ` +
          `Dia desejado: ${session.data.preferredDay || "não informado"}.`
      })
    )
  );

  await updateSession(phone, {
    state: STATES.MAIN_MENU,
    greeted: true
  });

  return null;
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
      await safeSend(() =>
        sendImageFromFile(phone, TRIAL_CLASS_IMAGE_PATH, TRIAL_CLASS_MENU_MESSAGE)
      );
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
  const normalizedQuestion = normalizeText(incomingText);
  const knowledgeEntry = findKnowledgeBaseEntry(normalizedQuestion);

  if (knowledgeEntry) {
    await updateSession(phone, {
      state: STATES.WAITING_AUTO_HELP_CONFIRM,
      data: {
        pendingQuestion: incomingText.trim(),
        autoHelpTopic: knowledgeEntry.topic
      }
    });

    if (knowledgeEntry.topic === "aula_teste") {
      await safeSend(() =>
        sendImageFromFile(phone, TRIAL_CLASS_IMAGE_PATH, knowledgeEntry.response)
      );
    } else {
      await safeSend(() => sendText(phone, knowledgeEntry.response));
    }

    return safeSend(() =>
      sendText(
        phone,
        buildBinaryChoiceMessage("❓ Isso tirou sua dúvida?")
      )
    );
  }

  await updateSession(phone, {
    state: STATES.WAITING_ATTENDANT_CONFIRM,
    data: {
      pendingQuestion: incomingText.trim()
    }
  });

  return safeSend(() =>
    sendText(
      phone,
      buildBinaryChoiceMessage(
        "📨 Não encontrei uma resposta exata por aqui. Deseja que eu encaminhe essa dúvida para a secretaria?"
      )
    )
  );
}

async function handleAutoHelpConfirm(phone, text, session) {
  if (text === "1" || text === "sim") {
    await updateSession(phone, {
      state: STATES.WAITING_POST_HELP_SCHEDULE_CONFIRM
    });

    return safeSend(() =>
      sendText(
        phone,
        buildBinaryChoiceMessage("✨ Que bom! Você gostaria de agendar uma visita?")
      )
    );
  }

  if (text === "2" || text === "nao") {
    await updateSession(phone, {
      state: STATES.WAITING_ATTENDANT_CONFIRM,
      data: {
        pendingQuestion: session.data.pendingQuestion || "Cliente pediu ajuda."
      }
    });

    return safeSend(() =>
      sendText(
        phone,
        buildBinaryChoiceMessage(
          "📨 Entendi. Deseja que eu encaminhe sua dúvida para a secretaria?"
        )
      )
    );
  }

  return safeSend(() =>
    sendText(phone, buildBinaryChoiceMessage("Me responda com:"))
  );
}

async function handlePostHelpScheduleConfirm(phone, text) {
  if (text === "1" || text === "sim") {
    return startSchedulingFlow(phone, "Fazer visita");
  }

  if (text === "2" || text === "nao") {
    return sendMainMenu(phone);
  }

  return safeSend(() =>
    sendText(phone, buildBinaryChoiceMessage("Me responda com:"))
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
    sendText(phone, buildBinaryChoiceMessage("Me responda com:"))
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

  if (hasSessionExpired(session)) {
    await clearSession(phone, {
      state: STATES.MAIN_MENU,
      greeted: false,
      cooldownUntil: null,
      lastInteractionAt: null,
      data: {}
    });

    await safeSend(() =>
      sendText(
        phone,
        '⌛ Seu atendimento anterior expirou por 1 hora de inatividade. Vamos recomeçar.'
      )
    );

    return sendIntroduction(phone);
  }

  await updateSession(phone, {
    lastInteractionAt: new Date().toISOString()
  });

  if (!session.greeted) {
    return sendIntroduction(phone);
  }

  switch (session.state) {
    case STATES.WAITING_INTRO_CONFIRM:
      if (!["1", "2", "3", "sim", "nao"].includes(text)) {
        return safeSend(() =>
          sendText(
            phone,
            buildBinaryChoiceMessage("Me responda com:", [
              "1 - Sim",
              "2 - Não",
              "3 - Área do responsável"
            ])
          )
        );
      }

      if (text === "3") {
        return sendMainMenu(phone);
      }

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

      if (age < 3) {
        return safeSend(() =>
          sendText(phone, "⚠️ Atendemos alunos com idade superior a 2 anos.")
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
          buildBinaryChoiceMessage(
            `🤝 Prazer, ${responsibleName}!\nVocê já conhece nossa companhia?`
          )
        )
      );
    }
    case STATES.WAITING_KNOWS_COMPANY:
      if (!["1", "2", "sim", "nao"].includes(text)) {
        return safeSend(() =>
          sendText(phone, buildBinaryChoiceMessage("Me responda com:"))
        );
      }

      await updateSession(phone, {
        state: STATES.WAITING_PROPOSAL_CONFIRM,
        data: {
          knowsCompany: text === "1" || text === "sim" ? "Sim" : "Não"
        }
      });

      await safeSend(() =>
        sendImageFromFile(phone, WHO_WE_ARE_IMAGE_PATH, COMPANY_PRESENTATION)
      );
      await wait(3000);
      return safeSend(() => sendText(phone, COMPANY_PRESENTATION_CONFIRM));
    case STATES.WAITING_PROPOSAL_CONFIRM:
      if (!["1", "2", "sim", "nao"].includes(text)) {
        return safeSend(() =>
          sendText(phone, buildBinaryChoiceMessage("Me responda com:"))
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
          `🕘 *QUAL PERÍODO DESEJA?*\n\n1 - Manhã\n2 - Tarde\n\n${BINARY_CHOICE_HINT}`
        )
      );
    }
    case STATES.WAITING_SHIFT: {
      const shift = mapChoice(text, SHIFT_OPTIONS);

      if (!shift) {
        return safeSend(() =>
          sendText(
            phone,
            `⚠️ Responda com 1 ou 2.\n\n1 - Manhã\n2 - Tarde\n\n${BINARY_CHOICE_HINT}`
          )
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
        if (schedule.handoffToAttendant) {
          await updateSession(phone, {
            data: {
              preferredDay: weekday
            }
          });

          session = await getSession(phone);
          return handoffScheduleByAge(phone, session, modality);
        }

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
          modality === "Ainda não sei"
            ? [
                "📌 Perfeito! Como você ainda quer conhecer melhor as modalidades, esta é a melhor sugestão para a visita:",
                "",
                `Tipo: ${schedule.classLabel}`,
                `Horário: ${schedule.scheduleText}`,
                "",
                "Podemos deixar agendado esse horário para você?",
                "",
                "1 - Sim",
                "2 - Não",
                "",
                BINARY_CHOICE_HINT
              ].join("\n")
            : [
                "📌 Pela idade do aluno, esta é a melhor sugestão:",
                "",
                `Turma: ${schedule.classLabel}`,
                `Faixa etária: ${schedule.ageGroupLabel}`,
                `Horário: ${schedule.scheduleText}`,
                "",
                "Podemos deixar agendado esse horário para você?",
                "",
                "1 - Sim",
                "2 - Não",
                "",
                BINARY_CHOICE_HINT
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
        sendText(phone, buildBinaryChoiceMessage("Me responda com:"))
      );
    case STATES.WAITING_OTHER_QUESTION:
      return handleOtherQuestion(phone, incomingText);
    case STATES.WAITING_AUTO_HELP_CONFIRM:
      return handleAutoHelpConfirm(phone, text, session);
    case STATES.WAITING_POST_HELP_SCHEDULE_CONFIRM:
      return handlePostHelpScheduleConfirm(phone, text);
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
