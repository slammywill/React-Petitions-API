import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import Logger from './logger';
import knex from 'knex';
dotenv.config();
// technically typed : {pool: mysql.Pool}
const state: any = {
    pool: null
};

const connect = async (): Promise<void> => {
    state.pool = await mysql.createPool( {
        connectionLimit: 100,
        multipleStatements: true,
        host: process.env.SENG365_MYSQL_HOST,
        user: process.env.SENG365_MYSQL_USER,
        password: process.env.SENG365_MYSQL_PASSWORD,
        database: process.env.SENG365_MYSQL_DATABASE,
        port: parseInt(process.env.SENG365_MYSQL_PORT,10) || 3306
    } );
    await state.pool.getConnection(); // Check connection
    Logger.info(`Successfully connected to database`)
    return
};

// technically typed : () => mysql.Pool
const getPool = () => {
    return state.pool;
};

const knexInstance = knex({
    client: 'mysql2',
    connection: {
        host: process.env.SENG365_MYSQL_HOST,
        user: process.env.SENG365_MYSQL_USER,
        password: process.env.SENG365_MYSQL_PASSWORD,
        database: process.env.SENG365_MYSQL_DATABASE,
        port: parseInt(process.env.SENG365_MYSQL_PORT,10) || 3306,
        charset: 'utf8mb4',
    }
});

export {connect, getPool, knexInstance}
