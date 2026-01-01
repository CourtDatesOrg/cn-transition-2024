const pg = require('pg');
const { ses_sendemail } = require('./ses_sendemail.js');

const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const s3Client = new S3Client({});
const region = 'us-east-1';
let secret;

async function getConnection(secretName) {
    const client = new SecretsManagerClient({
      region
    });
  
    let response;
    try {
      response = await client.send(
        new GetSecretValueCommand({
          SecretId: secretName,
          VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
        })
      );
      console.log('Result from secret get is console.log(response.SecretString)')
    } catch (error) {
      console.log(error);
      // For a list of exceptions thrown, see
      // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
      throw error;
    }
    console.log(response.SecretString)
    return JSON.parse(response.SecretString);
}

function parseLine(line) {
    const date = `${line.substring(33,37)}-${line.substring(37,39)}-${line.substring(39,41)}`;
    return {
        case_number: line.substring(1,14).trim(),
        case_type: line.substring(17,19).trim(),
        citation_number: line.substring(22,30).trim(),
        calendar_date: date,
        calendar_session: line.substring(44,46).trim(),
        courtroom: line.substring(49, 53).trim(),
        defendant_name: line.substring(56,84).trim(),
        defendant_race: line.substring(98,99).trim(),
        defendant_sex: line.substring(102,103).trim(),
        offense_code: line.substring(106,110).trim(),
        offense_description: line.substring(113,141).trim(),
        officer_witness_type: line.substring(144,145).trim(),
        officer_agency: line.substring(148,178).trim(),
        officer_number: line.substring(181,187).trim(),
        officer_name: line.substring(190,218).trim(),
        officer_city: line.substring(221,266).trim(),
        court_type: line.substring(269,270).trim(),
        ethnicity: line.substring(273, 274).trim(),
    };
}

async function getPercentageChange(client) {
    let pctChange = 1.;
    let res = await client.query('select count(*) from ct.criminal_dates_staging');
    const newLength = res.rows[0].count;
    res = await client.query('select count(*) from ct.criminal_dates');
    const oldLength = res.rows[0].count;
    if (oldLength > 0) {
        pctChange = Math.abs((newLength - oldLength)/oldLength);
    }
    console.log('Old, New lengths, Percent Change: ', oldLength, newLength, pctChange);
    return pctChange;
}

exports.lambda_handler = async function x(event, context) {
    let message = 'Data loaded successfully';
    let fileComment = '';
    let statusCode = 200;
    let lines = [];
    let pgClient = null;
    let bucket;
    let key;
    let insertedRecordCount = -1;
    if ('Records' in event) {
        // If triggered by creation of an object in S3
        bucket = event.Records[0].s3.bucket.name;
        key = event.Records[0].s3.object.key;
    } else if ('bucket' in event && 'key' in event) {
        // If triggered manually with a simple { "bucket": "<name>", "key": "key" event}
        bucket = event.bucket;
        key = event.key;
    }
    else {
        return {
            statusCode: 500,
            body: 'Unknown input: ' + JSON.stringify(event),
        }   
    }
    console.log('Bucket name: ', bucket);
    console.log('Object key:  ', key);
    const regex1 = new RegExp(process.env.FILE_REGEXP);
    let validFile = regex1.test(key);
    if (!validFile) fileComment = 'Not a valid file - not loaded';
    console.log('   validFile = ', validFile);

    if (validFile) {
        const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        });
    
        try {
            const response = await s3Client.send(command);
            const str = await response.Body.transformToString('UTF-16LE');
            lines = str.split('\n');
            console.log('Line 3: ', lines[2]);
        } catch (err) {
            message = 'Error getting court dates file from S3: ' + err;
            statusCode = 500;
            console.error(message);
            return {
                statusCode: statusCode,
                body: message,
            }    
        }
    }

    // PostgreSQL client setup
    try {
        const connection = await getConnection('court-dates-database');
        console.log('Connection is ', connection);
        const config = {
            host: connection.host,
            port: connection.port,
            user: connection.username,
            password: connection.password,
            database: connection.database,
            max: 10,
            idleTimeoutMillis: 10000,
            ssl: {
                rejectUnauthorized: false,
            },
          };
        console.log('Config is ', config);
        console.log('Now create the client');
        pgClient = new pg.Client(config);
        pgClient.connect();
    } catch (err) {
        message = 'Error connecting to the database: ' + err;
        statusCode = 500;
        console.error(message);
        return {
            statusCode: statusCode,
            body: message,
        }    
    }

    try {
        let query = `
            INSERT INTO cn.criminal_dates_staging (case_number, case_type, citation_number, calendar_date, calendar_session, courtroom,
            defendant_name, defendant_race, defendant_sex, offense_code, offense_description, officer_witness_type, 
            officer_agency, officer_number, officer_name, officer_city, court_type, ethnicity)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (case_number,case_type,courtroom,calendar_date)
            DO UPDATE SET
            case_type = EXCLUDED.case_type,
            citation_number = EXCLUDED.citation_number,
            calendar_date = EXCLUDED.calendar_date, 
            calendar_session = EXCLUDED.calendar_session,
            courtroom = EXCLUDED.courtroom,
            defendant_name = EXCLUDED.defendant_name, 
            defendant_race = EXCLUDED.defendant_race, 
            defendant_sex = EXCLUDED.defendant_sex, 
            offense_code = EXCLUDED.offense_code, 
            offense_description = EXCLUDED.offense_description, 
            officer_witness_type = EXCLUDED.officer_witness_type, 
            officer_agency = EXCLUDED.officer_agency, 
            officer_number = EXCLUDED.officer_number, 
            officer_name = EXCLUDED.officer_name, 
            officer_city = 'CONFLICT-CASE', --EXCLUDED.officer_city, 
            court_type = EXCLUDED.court_type, 
            ethnicity = EXCLUDED.ethnicity;
        `;
        if (validFile) {
            // Load the data into a staging table
            await pgClient.query('TRUNCATE cn.criminal_dates_staging;');

            for (let i = 1; i < lines.length; i += 1) {
                const record = parseLine(lines[i]);
                if (i < 3) {
                    console.log(record)
                }
                if (record.case_number.length > 0) {
                    const values = [
                        record.case_number,
                        record.case_type,
                        record.citation_number,
                        record.calendar_date,
                        record.calendar_session,
                        record.courtroom,
                        record.defendant_name,
                        record.defendant_race,
                        record.defendant_sex,
                        record.offense_code,
                        record.offense_description,
                        record.officer_witness_type,
                        record.officer_agency,
                        record.officer_number,
                        record.officer_name,
                        record.officer_city,
                        record.court_type,
                        record.ethnicity,
                    ];
                    await pgClient.query(query, values);
                }
            }
            if (process.env.MAX_PERCENT_CHANGE > 0) {
                const pctChange = await getPercentageChange(pgClient);
                if (pctChange > process.env.MAX_PERCENT_CHANGE) {
                    console.log('Percentage change exceeds limit', pctChange);
                    validFile = false;
                    fileComment = 'Percentage change exceeds limit - file not loaded';
                }
            }
        }

        // Now copy the data into the production table
        console.log('Start the transaction');
        await pgClient.query('BEGIN');

        query = `INSERT INTO cn.file_imports (filename, comment) VALUES ('${key}', '${fileComment}')`;
        console.log('File log: ', query);
        await pgClient.query(query);

        if (validFile) {
            query = `
                TRUNCATE TABLE cn.criminal_dates;
                INSERT INTO cn.criminal_dates
                SELECT case_number, case_type, citation_number, calendar_date, calendar_session, courtroom,
                    defendant_name, defendant_race, defendant_sex, offense_code, offense_description,
                    officer_witness_type, officer_agency, officer_number, officer_name, officer_city, 
                    court_type, ethnicity
                FROM cn.criminal_dates_staging;
            `;
            console.log('Now copy the staging table over');
            const tres = await pgClient.query(query);
            console.log(`Row count = ${tres[1].rowCount}`);
            insertedRecordCount = tres[1].rowCount;
        }
        console.log('Now commit');
        await pgClient.query('COMMIT');
        pgClient.end();
        await ses_sendemail(
            [process.env.NOTIFY_EMAIL],
            process.env.SYSTEM_EMAIL,
            `<p>Successfully loaded ${insertedRecordCount} records</p>`,
            `Successfully loaded ${insertedRecordCount} records`,
            'Load Data Successful',
        );
        console.log('Now done');
    } catch (err) {
        message = 'Error loading to the database: ' + err;
        statusCode = 500;
        console.error(message);
        await ses_sendemail(
            [process.env.NOTIFY_EMAIL],
            process.env.SYSTEM_EMAIL,
            `<p>Error loading data: ${message}</p>`,
            `Error loading data: ${message}`,
            'Load Data NOT Successful',
        );
    }
    finally {
        pgClient.end();
    }
    if (!validFile) {
        statusCode = 200;
        message = fileComment;
    }
    return {
        statusCode: statusCode,
        body: message,
    }    
  };
