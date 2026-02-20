require('dotenv').config({ path: '../.env' });
const { handler } = require('../netlify/functions/log-download.js');

async function testFunction() {
    const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
            name: 'Netlify Function Test CJS',
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
