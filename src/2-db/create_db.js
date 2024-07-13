const { Client } = require('pg');
const fs = require('fs');

lambda_handler = async function (event, context) {
  let sql = fs.readFileSync('./createNewCourtDatesDB.sql').toString();
  const host = process.env.CN_DB_HOST_ENDPOINT.split(':')[0];
  console.log('The host is ', host);
  console.log('Password is ', process.env.CN_DB_PASSWORD);
  const client = new Client({
    host: host,
    user: 'cn',
    password: process.env.CN_DB_PASSWORD,
    database: 'cn',
    max: 10,
    idleTimeoutMillis: 10000,
  });
  console.log('Now connect');
  await client.connect()
  console.log('Now run the query');
  const res = await client.query(sql);

  await client.end()
  return res;
}

lambda_handler()
