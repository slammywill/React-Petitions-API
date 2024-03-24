import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitions from "../models/petition.model";
import * as supporters from "../models/supporter.model";
import {getUserIdByToken} from "../models/user.model";
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import * as support_tiers from "../models/support_tier.model";


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId = req.params.id;
        if (isNaN(parseInt(petitionId, 10))) {
            res.statusMessage = `Bad Request: id ${petitionId} is not a number`;
            res.status(400).send();
            return;
        }

        const petition = await petitions.getById(parseInt(petitionId, 10));

        // Check petition with id petitionId exists
        if (!petition) {
            res.statusMessage = `Not Found: No petition with id ${petitionId}`;
            res.status(404).send();
            return;
        }

        const allSupporters = await supporters.getAllByPetitionId(parseInt(petitionId, 10));

        res.statusMessage = 'OK';
        res.status(200).send(allSupporters);



    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId = req.params.id;
        if (isNaN(parseInt(petitionId, 10))) {
            res.statusMessage = `Bad Request: id ${petitionId} is not a number`;
            res.status(400).send();
            return;
        }

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

        const supportTierId = req.body.supportTierId;
        let message = req.body.message;

        const validation = await validate(schemas.support_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad request`;
            res.status(400).send();
            return;
        }

        // Check support tier exists
        if ((await support_tiers.getById(supportTierId)).length === 0) {
            res.statusMessage = 'Not Found: Support tier does not exist';
            res.status(404).send();
            return;
        }

        // Check not supporting own petition
        if (petition.ownerId === parseInt(userId, 10)) {
            res.statusMessage = 'Forbidden: Cannot support your own petition';
            res.status(403).send();
            return;
        }

        // Check not already supporting at this tier
        const userSupported = await supporters.getByUserIdAndPetition(
            parseInt(userId, 10),
            parseInt(petitionId, 10));
        let supported = false;
        for (const supporter of userSupported) {
            if (supporter.supporterId === parseInt(userId, 10) &&
                supporter.supportTierId ===  parseInt(supportTierId, 10)) supported = true;
        }
        if (supported) {
            res.statusMessage = 'Forbidden: Already supported at this tier';
            res.status(403).send();
            return;
        }

        if (!message) {
            message = null;
        }

        await supporters.insert(
            parseInt(supportTierId, 10),
            parseInt(petitionId, 10),
            parseInt(userId, 10),
            message);
        res.statusMessage = 'Created';
        res.status(201).send();

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllSupportersForPetition, addSupporter}