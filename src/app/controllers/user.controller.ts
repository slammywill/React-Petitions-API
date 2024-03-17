import {Request, Response} from "express";
import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import {validate} from '../resources/validate';
import Logger from '../../config/logger';
import * as passwords from '../services/passwords';

const register = async (req: Request, res: Response): Promise<void> => {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    const hashedPassword = await passwords.hash(password);

    Logger.http('POST: Register a new user')
    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    try{
        const emailTakenResult = await users.getUserByEmail( email );
        if (emailTakenResult.length !== 0) {
            res.statusMessage = 'Forbidden: Email already in use';
            res.status(403).send();
            return;
        }
        const addUserResult = await users.insert(
            email,
            firstName,
            lastName,
            hashedPassword
        )
        res.statusMessage = `Created: UserId = ${addUserResult.insertId}`;
        res.status(201).send({'userId': addUserResult.insertId});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}