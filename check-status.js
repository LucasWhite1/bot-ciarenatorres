require('dotenv').config();
const axios = require('axios');

const {
    EVOLUTION_API_URL,
    EVOLUTION_MANAGER_KEY,
    EVOLUTION_INSTANCE_NAME
} = process.env;

async function checkStatus() {
    try {
        const url = `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`;
        const response = await axios.get(url, {
            headers: {
                'apikey': EVOLUTION_MANAGER_KEY
            }
        });

        console.log('Instance Status:', response.data);
    } catch (error) {
        console.error('Error checking status:', error.response?.data || error.message);
    }
}

checkStatus();
