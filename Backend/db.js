const { Pool } = require('pg');

let connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.DB_HOST && process.env.DB_USER) {
    const port = process.env.DB_PORT || 5432;
    connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}`;
}

const pool = new Pool({
    connectionString,
    // Add these for better reliability on AWS/GCP
    max: 20, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // how long to wait for a connection
    query_timeout: 10000 // how long to wait for a query to complete
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle pg client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
