require('dotenv').config();
const { handler } = require('../netlify/functions/log-download');

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
