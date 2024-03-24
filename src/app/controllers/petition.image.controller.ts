import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitions from "../models/petition.model";
import fs from "mz/fs";
import mime from "mime-types";
import logger from "../../config/logger";
import {getUserIdByToken} from "../models/user.model";
import * as users from "../models/user.model";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId = req.params.id;
        const petition = await petitions.getById(parseInt(petitionId, 10));
        const petitionWithImage = (await petitions.getPetitionWithFilename(parseInt(petitionId, 10)));
        const imageFilename = petitionWithImage.imageFilename;

        if (!petition) {
            res.statusMessage = `Not Found: No petition with id ${petitionId}`;
            res.status(404).send();
            return;
        }

        if (!imageFilename) {
            res.statusMessage = 'Not Found: Petition has no image';
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
    try{
        // Check petitionId is a number
        const petitionId = req.params.id;
        if (isNaN(parseInt(petitionId, 10))) {
            res.statusMessage = `Bad Request: id ${petitionId} is not a number`;
            res.status(400).send();
            return;
        }

        // Check that the request has a token
        const token = req.header("X-Authorization");
        if (!token) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const userId = await getUserIdByToken(token);
        const petition = await petitions.getById(parseInt(petitionId, 10));

        // Check petition with id petitionId exists
        if (!petition) {
            res.statusMessage = `Not Found: No petition with id ${petitionId}`;
            res.status(404).send();
            return;
        }

        // Check request userId = ownerId
        if (parseInt(userId, 10) !== petition.ownerId) {
            res.statusMessage = 'Forbidden: Only the owner of a petition can change the hero image';
            res.status(403).send();
            return;
        }

        const petitionWithImage = await petitions.getPetitionWithFilename(parseInt(petitionId, 10));

        const imageData = req.body;
        const validImageTypes = ['image/png', 'image/jpg', 'image/gif', 'image/jpeg'];
        const contentType = req.header("Content-Type");
        if (imageData === undefined || !validImageTypes.includes(contentType)) {
            res.statusMessage = 'Bad Request: Invalid image supplied';
            res.status(400).send();
        }
        const userHadPicture = petitionWithImage.imageFilename !== null;
        const imageFilename = petitionId + '.' + contentType.slice(6);
        await fs.writeFile('storage/images/' + imageFilename, imageData);
        await petitions.updateImageFilename(parseInt(petitionId, 10), imageFilename);
        if (userHadPicture) {
            res.statusMessage = 'OK: Image updated';
            res.status(200).send();
        } else {
            res.statusMessage = 'Created: Hero image created';
            res.status(201).send();
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


export {getImage, setImage};