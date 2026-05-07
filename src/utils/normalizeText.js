function normalizeText(value) {
  const emojiMap = {
    "1️⃣": "1", "2️⃣": "2", "3️⃣": "3", "4️⃣": "4", "5️⃣": "5",
    "6️⃣": "6", "7️⃣": "7", "8️⃣": "8", "9️⃣": "9", "0️⃣": "0"
  };

  let text = String(value || "").trim();
  
  // Replace direct emoji matches
  if (emojiMap[text]) {
    return emojiMap[text];
  }

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

module.exports = normalizeText;
