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
        if (token ===  "") {
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

        // Set the new image to the user and save it
        const imageData = req.body;
        const user = (await users.getUserById(parseInt(id, 10)))[0];
        const validImageTypes = ['image/png', 'image/jpg', 'image/gif', 'image/jpeg'];
        const contentType = req.header("Content-Type");
        if (imageData === undefined || !validImageTypes.includes(contentType)) {
            res.statusMessage = 'Bad Request: Invalid image supplied';
            res.status(400).send();
        }
        const userHadPicture = user.image_filename !== null;
        const imageFilename = id + '.' + contentType.slice(6);
        await fs.writeFile('storage/images/' + imageFilename, imageData);
        await users.updateImageFilename(parseInt(id, 10), imageFilename);
        if (userHadPicture) {
            res.statusMessage = 'OK: Image updated';
            res.status(200).send();
        } else {
            res.statusMessage = 'Created: User image created';
            res.status(201).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    const reqId = req.params.id;
    const token = req.header("X-Authorization");
    try{
        // Send 404 if :id is not valid
        if (! await users.checkIdIsValid(parseInt(reqId, 10))) {
            res.statusMessage = 'Not found: No user with specified ID';
            res.status(404).send();
            return;
        }

        // Send 401 if user is unauthorized
        if (token ===  "") {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }

        // Send 403 if token id does not match requested id
        const id = await users.getUserIdByToken(token);
        if (reqId !== id) {
            res.statusMessage = "Forbidden: Can not delete another user's profile photo";
            res.status(403).send();
            return;
        }

        // Check if user has a picture to delete
        const user = (await users.getUserById(parseInt(id, 10)))[0];
       if (user.image_filename === null) {
           res.statusMessage = "Not found: User does not have a profile picture";
           res.status(404).send();
           return;
       }

       // Delete image and remove filename from user
       await fs.unlink('storage/images/' + user.image_filename);
       await users.updateImageFilename(parseInt(id, 10), null);
       res.statusMessage = 'OK';
       res.status(200).send();
       return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}