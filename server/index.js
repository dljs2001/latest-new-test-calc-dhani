import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Client } = pg;
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const connectionString = 'postgresql://neondb_owner:npg_VjQUeDagK0O9@ep-steep-fire-ae637xly-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect()
    .then(() => console.log('Connected to database'))
    .catch(err => console.error('Connection error', err.stack));

app.post('/api/log-download', async (req, res) => {
    const { name, loanAmount } = req.body;

    if (!name || !loanAmount) {
        return res.status(400).json({ error: 'Name and Loan Amount are required' });
    }

    try {
        const query = 'INSERT INTO pdf_downloads (user_name, loan_amount) VALUES ($1, $2) RETURNING *';
        const values = [name, loanAmount];
        const result = await client.query(query, values);

        console.log('Data inserted successfully:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
