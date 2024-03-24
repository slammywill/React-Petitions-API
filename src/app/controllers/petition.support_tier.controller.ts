import {Request, Response} from "express";
import Logger from "../../config/logger";
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import {getUserIdByToken} from "../models/user.model";
import * as petitions from "../models/petition.model";
import * as support_tiers from "../models/support_tier.model";
import * as supporters from "../models/supporter.model";

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = req.params.id;

        const validation = await validate(schemas.support_tier_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad request`;
            res.status(400).send();
            return;
        }

        if (isNaN(parseInt(petitionId, 10))) {
            res.statusMessage = `Bad Request: id ${petitionId} is not a number`;
            res.status(400).send();
            return;
        }

        const title = req.body.title;
        const description = req.body.description;
        const cost = req.body.cost;

        const token = req.header("X-Authorization");
        if (!token) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const userId = await getUserIdByToken(token);

        const petition = await petitions.getById(parseInt(petitionId, 10));

        if (!petition) {
            res.statusMessage = `Not Found: No petition with id ${petitionId}`;
            res.status(404).send();
            return;
        }

        if (parseInt(userId, 10) !== petition.ownerId) {
            res.statusMessage = 'Forbidden: Only the owner of a petition may update it';
            res.status(403).send();
            return;
        }

        if ((await support_tiers.getByPetitionId(parseInt(petitionId, 10))).length  >= 3) {
            res.statusMessage = 'Forbidden: Cannot add a support tier if 3 already exist';
            res.status(403).send();
            return;
        }

        if ((await support_tiers.getByTitle(title, parseInt(petitionId, 10))).length !== 0) {
            res.statusMessage = 'Forbidden: Support title not unique within petition';
            res.status(403).send();
            return;
        }

        await support_tiers.insert(parseInt(petitionId, 10), title, description, cost);
        res.statusMessage = 'OK';
        res.status(201).send();


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = req.params.id;
        const supportTierId = req.params.tierId;

        const validation = await validate(schemas.support_tier_patch, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad request`;
            res.status(400).send();
            return;
        }

        if (isNaN(parseInt(petitionId, 10))) {
            res.statusMessage = `Bad Request: id ${petitionId} is not a number`;
            res.status(400).send();
            return;
        }

        const title = req.body.title;
        const description = req.body.description;
        const cost = req.body.cost;

        const token = req.header("X-Authorization");
        if (!token) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const userId = await getUserIdByToken(token);

        const petition = await petitions.getById(parseInt(petitionId, 10));

        if (!petition) {
            res.statusMessage = `Not Found: No petition with id ${petitionId}`;
            res.status(404).send();
            return;
        }

        if (parseInt(userId, 10) !== petition.ownerId) {
            res.statusMessage = 'Forbidden: Only the owner of a petition may update it';
            res.status(403).send();
            return;
        }

        const supportTier = (await support_tiers.getById(parseInt(supportTierId, 10)))[0];

        if (!supportTier) {
            res.statusMessage = `Not Found: No support tier with id ${supportTierId}`;
            res.status(404).send();
            return;
        }

        if (title && (await support_tiers.getByTitle(title, parseInt(petitionId, 10))).length !== 0) {
            res.statusMessage = 'Forbidden: Support title not unique within petition';
            res.status(403).send();
            return;
        }

        if ((await supporters.getBySupportTierId(parseInt(supportTierId, 10))).length !== 0) {
            res.statusMessage = 'Forbidden: Can not edit a support tier if a supporter already exists for it';
            res.status(403).send();
            return;
        }

        if (title && title !== supportTier.title) await support_tiers.updateTitle(parseInt(supportTierId, 10), title);
        if (description && description !== supportTier.description) await support_tiers.updateDescription(parseInt(supportTierId, 10), description);
        if (cost && cost !== supportTier.cost) await support_tiers.updateCost(parseInt(supportTierId, 10), cost);

        res.statusMessage = 'OK';
        res.status(200).send();

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = req.params.id;
        const supportTierId = req.params.tierId;

        const token = req.header("X-Authorization");
        if (!token) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }

        if (isNaN(parseInt(petitionId, 10))) {
            res.statusMessage = `Bad Request: id ${petitionId} is not a number`;
            res.status(400).send();
            return;
        }

        const userId = await getUserIdByToken(token);
        const petition = await petitions.getById(parseInt(petitionId, 10));

        if (!petition) {
            res.statusMessage = `Not Found: No petition with id ${petitionId}`;
            res.status(404).send();
            return;
        }

        if (parseInt(userId, 10) !== petition.ownerId) {
            res.statusMessage = 'Forbidden: Only the owner of a petition may update it';
            res.status(403).send();
            return;
        }

        const supportTier = (await support_tiers.getById(parseInt(supportTierId, 10)))[0];

        if (!supportTier) {
            res.statusMessage = `Not Found: No support tier with id ${supportTierId}`;
            res.status(404).send();
            return;
        }

        if ((await supporters.getBySupportTierId(parseInt(supportTierId, 10))).length !== 0) {
            res.statusMessage = 'Forbidden: Can not delete a support tier if a supporter already exists for it';
            res.status(403).send();
            return;
        }

        if ((await support_tiers.getByPetitionId(parseInt(petitionId, 10))).length === 1) {
            res.statusMessage = 'Forbidden: Can not remove a support tier if it is the only one for a petition';
            res.status(403).send();
        }

        await support_tiers.deleteSupportTier(parseInt(supportTierId, 10));
        res.statusMessage = 'OK';
        res.status(200).send();

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {addSupportTier, editSupportTier, deleteSupportTier};