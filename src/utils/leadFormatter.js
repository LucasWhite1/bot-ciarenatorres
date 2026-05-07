function formatLeadSummary(lead) {
  return [
    "📌 NOVO AGENDAMENTO / LEAD",
    "",
    `Responsável: ${lead.responsibleName}`,
    `Aluno: ${lead.studentName}`,
    `Idade: ${lead.studentAge}`,
    `Modalidade: ${lead.modality}`,
    `Turno: ${lead.shift}`,
    `Melhor dia: ${lead.visitDay}`,
    `Como conheceu: ${lead.origin}`,
    `WhatsApp: ${lead.phone}`,
    "",
    "Objetivo: visita/aula teste"
  ].join("\n");
}

function formatAttendantSummary(payload) {
  return [
    "📞 SOLICITAÇÃO DE ATENDENTE",
    "",
    `Nome/WhatsApp: ${payload.phone}`,
    `Dúvida: ${payload.question}`,
    "",
    "Responder assim que possível."
  ].join("\n");
}

module.exports = {
  formatLeadSummary,
  formatAttendantSummary
};
