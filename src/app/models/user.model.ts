import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import jwt, {JwtPayload} from "jsonwebtoken";


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

const updateToken = async (id: number, token: string) : Promise<void> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?';
    const [ result ] = await conn.query(query, [ token, id ]);
    await conn.release();
    return result;
}

const getUserIdByToken = async (token:string) : Promise<string> => {
    const decodedToken: JwtPayload | string = jwt.decode(token);
    let tokenId = null;
    if (typeof decodedToken === 'object') {
        tokenId = (decodedToken as JwtPayload).id;
    }
    return tokenId.toString();
}

const checkIdIsValid = async (id:number) : Promise<boolean> => {
    // Checks if the provided id is a number.
    if (isNaN(id)) {
        return false;
    }
    // Checks if there is a user with the provided id.
    const result = await getUserById(id);
    if (result.length === 0) {
        return false;
    }
    return true;
}

const updateEmail = async (id: number, email:string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET email = ? WHERE id = ?';
    const [ result ] = await conn.query(query, [ email, id ]);
    await conn.release();
    return result;
}

const updateFirstName = async (id: number, firstName:string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET first_name = ? WHERE id = ?';
    const [ result ] = await conn.query(query, [ firstName, id ]);
    await conn.release();
    return result;
}

const updateLastName = async (id: number, lastName:string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET last_name = ? WHERE id = ?';
    const [ result ] = await conn.query(query, [ lastName, id ]);
    await conn.release();
    return result;
}

const updatePassword = async (id: number, password:string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET password = ? WHERE id = ?';
    const [ result ] = await conn.query(query, [ password, id]);
    await conn.release();
    return result;
}

const updateImageFilename = async (id:number, filename:string): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET image_filename = ? WHERE id = ?';
    const [ result ] = await conn.query(query, [ filename, id]);
    await conn.release();
    return result;
}


export {getUserByEmail,
    getUserById,
    insert,
    updateToken,
    getUserIdByToken,
    checkIdIsValid,
    updateEmail,
    updatePassword,
    updateFirstName,
    updateLastName,
    updateImageFilename
}

