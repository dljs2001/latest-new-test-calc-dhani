const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        const { name, loanAmount } = JSON.parse(event.body);

        if (!name || !loanAmount) {
            await client.end();
            return { statusCode: 400, body: JSON.stringify({ error: 'Name and Loan Amount are required' }) };
        }

        const query = 'INSERT INTO pdf_downloads (user_name, loan_amount) VALUES ($1, $2) RETURNING *';
        const values = [name, loanAmount];
        const result = await client.query(query, values);

        await client.end();

        return {
            statusCode: 201,
            body: JSON.stringify(result.rows[0]),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // CORS support
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    } catch (err) {
        console.error('Error executing query', err);
        await client.end();
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
