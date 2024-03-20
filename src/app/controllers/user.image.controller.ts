import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as schemas from "../resources/schemas.json";
import * as users from "../models/user.model";
import fs from "mz/fs";
import mime from "mime-types";

const getImage = async (req: Request, res: Response): Promise<void> => {
    const reqId = req.params.id;
    try{
        // Send 404 if :id is not valid
        if (! await users.checkIdIsValid(parseInt(reqId, 10))) {
            res.statusMessage = 'Not found: No user with specified ID';
            res.status(404).send();
            return;
        }
        const user = (await users.getUserById(parseInt(reqId, 10)))[0];
        const imageFilename = user.image_filename;

        // Send 404 if user does not have an image
        if (imageFilename === null) {
            res.statusMessage = 'Not found: User has no image';
            res.status(404).send();
            return;
        }
        // Send 200 with image
        const imageData = await fs.readFile('storage/images/' + imageFilename);
        const mimeType = mime.contentType(imageFilename).toString();
        res.setHeader("Content-Type", mimeType);
        res.statusMessage = 'OK';
        res.status(200).send(imageData);

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    const token = req.header("X-Authorization");
    const reqId = req.params.id;
    Logger.info(reqId);
    try{
        // Send 404 if :id is not valid
        if (! await users.checkIdIsValid(parseInt(reqId, 10))) {
            res.statusMessage = 'Not found: No user with specified ID';
            res.status(404).send();
            return;
        }

        // Send 401 if user is unauthorized
        if (token === undefined) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }

        // Send 403 if token id does not match requested id
        const id = await users.getUserIdByToken(token);
        if (reqId !== id) {
            res.statusMessage = "Forbidden: Can not change another user's profile photo";
            res.status(403).send();
            return;
        }

        const imageData = req.body;
        const validImageTypes = ['image/png', 'image/jpg', 'image/gif', 'image/jpeg'];
        const contentType = req.header("Content-Type");
        if (imageData === undefined || !validImageTypes.includes(contentType)) {
            res.statusMessage = 'Bad Request: Invalid image supplied';
            res.status(400).send();
        }
        await fs.writeFile('storage/images/' + id + 'Picture', imageData);
        res.statusMessage = 'OK';
        res.status(200).send();

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
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

export {getImage, setImage, deleteImage}