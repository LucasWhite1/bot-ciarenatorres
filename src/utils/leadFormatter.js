function formatLeadSummary(lead) {
  return [
    "NOVO AGENDAMENTO / LEAD",
    "",
    `Objetivo: ${lead.schedulingPurpose || "agendamento"}`,
    `Responsavel: ${lead.responsibleName || "nao informado"}`,
    `Aluno: ${lead.studentName || "nao informado"}`,
    `Idade: ${lead.studentAge || "nao informada"}`,
    `Conhece a companhia: ${lead.knowsCompany || "nao informado"}`,
    `Entendeu a proposta: ${lead.understoodProposal || "nao informado"}`,
    `Modalidade: ${lead.modality || "nao informada"}`,
    `Periodo desejado: ${lead.shift || "nao informado"}`,
    `Dia desejado: ${lead.preferredDay || "nao informado"}`,
    `Turma sugerida: ${lead.suggestedClassLabel || "nao definida"}`,
    `Faixa etaria: ${lead.suggestedAgeGroup || "nao definida"}`,
    `Horario sugerido: ${lead.suggestedSchedule || "nao definido"}`,
    `Horario confirmado pelo cliente: ${lead.scheduleConfirmed || "nao informado"}`,
    `WhatsApp: ${lead.phone}`
  ].join("\n");
}

function formatAttendantSummary(payload) {
  return [
    "SOLICITACAO DE ATENDENTE",
    "",
    `WhatsApp: ${payload.phone}`,
    `Duvida: ${payload.question}`,
    "",
    "Responder assim que possivel."
  ].join("\n");
}

module.exports = {
  formatLeadSummary,
  formatAttendantSummary
};
