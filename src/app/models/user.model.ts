import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';


const getUserByEmail = async (email: string) : Promise<User[]> => {
    Logger.info(`Getting user with email ${email}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = ?';
    const [ rows ] = await conn.query(query, [ email ]);
    await conn.release();
    return rows;
};

const getUserById = async (id: number) : Promise<User[]> => {
    Logger.info(`Getting user with id ${id}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE id = ?';
    const [ rows ] = await conn.query(query, [ id ]);
    await conn.release();
    return rows;
}

const insert = async (email: string, firstName: string, lastName: string, password: string)
    : Promise<ResultSetHeader> => {
    Logger.info(`Adding username with email ${email} to the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO user (email, first_name, last_name, password) VALUES ( ?, ?, ?, ?)';
    const [ result ] = await conn.query(query, [ email, firstName, lastName, password ]);
    await conn.release();
    return result;
}


export {getUserByEmail, getUserById, insert}

