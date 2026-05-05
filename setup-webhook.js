require('dotenv').config();
const axios = require('axios');

const {
    EVOLUTION_API_URL,
    EVOLUTION_MANAGER_KEY,
    EVOLUTION_INSTANCE_NAME
} = process.env;

async function setupWebhook() {
    const webhookUrl = process.argv[2];

    if (!webhookUrl) {
        console.error('Please provide a webhook URL. Usage: node setup-webhook.js https://your-domain.com/webhook');
        process.exit(1);
    }

    try {
        const url = `${EVOLUTION_API_URL}/webhook/set/${EVOLUTION_INSTANCE_NAME}`;
        const data = {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            events: [
                "MESSAGES_UPSERT"
            ]
        };

        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_MANAGER_KEY
            }
        });

        console.log('Webhook configured successfully!');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error configuring webhook:', error.response?.data || error.message);
    }
}

setupWebhook();
