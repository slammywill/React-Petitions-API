import {Request, Response} from "express";
import * as schemas from '../resources/schemas.json';
import * as users from '../models/user.model';
import {validate} from '../resources/validate';
import Logger from '../../config/logger';
import * as passwords from '../services/passwords';
import jwt from 'jsonwebtoken';
import {getUserById} from "../models/user.model";
const register = async (req: Request, res: Response): Promise<void> => {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    const hashedPassword = await passwords.hash(password);

    Logger.http('POST: Register a new user')
    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad request: Invalid information`;
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
        res.statusMessage = `Created`;
        res.status(201).send({'userId': addUserResult.insertId});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = await passwords.hash(password);
    try {
        const result = await users.getUserByEmail(email);
        if (result.length === 0) {
            res.statusMessage = "Unauthorized. Incorrect email/password";
            res.status(401).send();
            return;
        }
        const user = result[0];
        const id = user.id;
        const passwordMatch = await passwords.compare(user.password, hashedPassword);
        if (!passwordMatch) {
            res.statusMessage = "Unauthorized. Incorrect email/password";
            res.status(401).send();
            return;
        }
        const token = jwt.sign({id}, 'secret-key', {
            expiresIn: '1hr'
        });
        res.statusMessage = `OK`;
        res.status(200).send({"userId": id, "token": token})
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.header("X-Authorization");
    try{
        if (token === "") {
            res.statusMessage = "Unauthorized. Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        }
        const decoded = jwt.verify(token, 'secret-key');
        res.statusMessage = "OK";
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    const reqId = req.params.id;
    const token = req.header("X-Authorization");
    try{
        if (isNaN(parseInt(reqId, 10))) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const result = await users.getUserById(parseInt(reqId, 10));
        if (result.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const user = result[0];
        const id = user.id;
        const email = user.email;

        if (token === "") {
            res.statusMessage = "OK";
            res.send({"firstName": user.firstName, "lastName": user.lastName});
            return;
        }
        const decoded = jwt.verify(token, 'secret-key');
        Logger.info(decoded.toString() + "I am decoded");
        // if (decoded.id === reqId) {
        //
        // }

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