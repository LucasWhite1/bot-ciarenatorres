require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const {
    EVOLUTION_API_URL,
    EVOLUTION_MANAGER_KEY,
    EVOLUTION_INSTANCE_TOKEN,
    EVOLUTION_INSTANCE_NAME,
    PORT = 3000
} = process.env;

// Helper to send messages
async function sendMessage(to, text) {
    try {
        const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;
        const data = {
            number: to,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: false
            },
            textMessage: {
                text: text
            }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_MANAGER_KEY
            }
        });

        console.log(`Message sent to ${to}: ${text.substring(0, 20)}...`);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
    const { event, data } = req.body;

    // Only process messages.upsert and only if it's not from us
    if (event === 'messages.upsert' && !data.key.fromMe) {
        const remoteJid = data.key.remoteJid;
        const pushName = data.pushName || 'cliente';
        
        // Extract message text
        let messageText = '';
        if (data.messageType === 'conversation') {
            messageText = data.message.conversation;
        } else if (data.messageType === 'extendedTextMessage') {
            messageText = data.message.extendedTextMessage.text;
        }

        console.log(`Received message from ${pushName} (${remoteJid}): ${messageText}`);

        // Logic for the bot
        if (messageText === '1') {
            await sendMessage(remoteJid, `Olá ${pushName}! Você escolheu a Opção 1. Em que posso ajudar com isso?`);
        } else if (messageText === '2') {
            await sendMessage(remoteJid, `Olá ${pushName}! Você escolheu a Opção 2. Estamos processando seu pedido.`);
        } else {
            // Default menu
            const menuText = `Olá ${pushName}! Bem-vindo ao nosso atendimento.\n\nPor favor, escolha uma opção:\n\n1 - Falar com suporte\n2 - Informações sobre pedidos`;
            await sendMessage(remoteJid, menuText);
        }
    }

    return res.status(200).send({ status: 'SUCCESS' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Webhook URL should be: <YOUR_TUNNEL_URL>/webhook`);
});
