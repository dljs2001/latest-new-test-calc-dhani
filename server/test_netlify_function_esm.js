
import dotenv from 'dotenv';
import { handler } from '../netlify/functions/log-download.js';

dotenv.config({ path: '../.env' }); // Load .env from root

async function testFunction() {
    const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
            name: 'Netlify Function Test',
            loanAmount: '9,99,999'
        })
    };

    const context = {};

    try {
        const response = await handler(event, context);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

testFunction();
