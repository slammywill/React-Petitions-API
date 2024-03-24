import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model';
import * as support_tiers from '../models/support_tier.model';
import * as categories from '../models/cateory.model';
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";
import logger from "../../config/logger";
import {getUserIdByToken} from "../models/user.model";
import {getByPetitionId} from "../models/support_tier.model";

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.petition_search, req.query);
        if (validation !== true) {
            res.statusMessage = `Bad request`;
            res.status(400).send();
            return;
        }

        const startIndex = parseInt(req.query.startIndex as string, 10);
        const count = parseInt(req.query.count as string, 10);
        const q = req.query.q as string;
        const categoryIdsStrings = req.query.categoryIds as string[];
        const supportingCost = parseInt(req.query.supportingCost as string, 10);
        const ownerId = parseInt(req.query.ownerId as string, 10);
        const supporterId = parseInt(req.query.supporterId as string, 10);
        const sortBy = req.query.sortBy as string;

        let categoryIds: number[];
        if (categoryIdsStrings !== undefined) {
            categoryIds = categoryIdsStrings.map(str => parseInt(str, 10));
        }

        let result = await petitions.getSubset(
            startIndex,
            count,
            q,
            categoryIds,
            supportingCost,
            ownerId,
            supporterId,
            sortBy);

        const originalLength = result.length;

        if (!isNaN(startIndex)) {
            if (startIndex < result.length) {
                result = result.slice(startIndex);
            } else {
                res.statusMessage = 'Bad Request: Start index larger than # of query results';
                res.status(400).send();
            }
        }

        if (!isNaN(count)) {
            if (count < result.length) {
                result = result.slice(0, count);
            } else {
                res.statusMessage = 'Bad Request: Count larger than # of query results';
                res.status(400).send();

            }
        }

        res.statusMessage = 'OK';
        res.status(200).send({'petitions': result, 'count': originalLength});
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const petitionId = req.params.id;
        const result = await petitions.getById(parseInt(petitionId, 10));

        if (!result) {
            res.statusMessage = `Not Found: No petition with id ${petitionId}`;
            res.status(404).send();
            return;
        }
        const tiers = await support_tiers.getByPetitionId(parseInt(petitionId, 10));

        res.statusMessage = 'OK';
        res.status(200).send({
            "petitionId": result.petitionId,
            "title": result.title,
            "categoryId": result.categoryId,
            "ownerId": result.ownerId,
            "ownerFirstName": result.ownerFirstName,
            "ownerLastName": result.ownerLastName,
            "numberOfSupporters": result.numberOfSupporters,
            "creationDate": result.creationDate,
            "description": result.description,
            "moneyRaised": result.moneyRaised,
            "supportTiers": tiers});
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(schemas.petition_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad request`;
            res.status(400).send();
            return;
        }

        const title = req.body.title;
        const description = req.body.description;
        const categoryId = req.body.categoryId;
        const supportTiers = req.body.supportTiers;

        const token = req.header("X-Authorization");
        if (!token) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const id = await getUserIdByToken(token);

        const category = await categories.getById(categoryId);
        if (category.length === 0) {
            res.statusMessage = `Bad Request: Category with id ${categoryId} does not exist`;
            res.status(400).send();
            return;
        }

        if (1 > supportTiers.length || 3 < supportTiers.length) {
            res.statusMessage = 'Bad Request: Petition must have 1-3 support tiers';
            res.status(400).send();
        }

        // check the support tier titles are unique
        const supportTierTitles = supportTiers.map((supportTier: { title: string; }) => supportTier.title);
        let allUnique = true;
        for (const t of supportTierTitles) {
            if (supportTierTitles.indexOf(t) !== supportTierTitles.lastIndexOf(t)) {
                allUnique = false;
            }
        }
        if (!allUnique) {
            res.statusMessage = 'Forbidden: Duplicate supportTier titles';
            res.status(403).send();
        }

        if ((await petitions.getByTitle(title)).length !== 0) {
            res.statusMessage = `Forbidden: Petition with title ${title} already exists`;
            res.status(403).send();
        }

        // Add petition
        const newPetitionId = await petitions.insert(parseInt(id, 10), title, description, categoryId);

        // Add support tiers
        for (const supportTier of supportTiers) {
            await support_tiers.insert(newPetitionId, supportTier.title, supportTier.description, supportTier.cost);
        }

        res.statusMessage = "Created";
        res.status(201).send({'petitionId': newPetitionId});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = req.params.id;
        const validation = await validate(schemas.petition_patch, req.body);
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

        const newTitle = req.body.title;
        const newDescription = req.body.description;
        const newCategoryId = req.body.categoryId;

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

        if ((await petitions.getByTitle(newTitle)).length !== 0) {
            res.statusMessage = `Forbidden: Petition with title ${newTitle} already exists`;
            res.status(403).send();
            return;
        }

        if (newTitle && newTitle !== petition.title) await petitions.updateTitle(parseInt(petitionId, 10), newTitle);
        if (newDescription && newDescription !== petition.description) await petitions.updateDescription(parseInt(petitionId, 10), newDescription);
        if (newCategoryId && newCategoryId !== petition.categoryId) await petitions.updateCategoryId(parseInt(petitionId, 10), newCategoryId);

        res.statusMessage = 'OK';
        res.status(200).send();


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
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
            res.statusMessage = 'Forbidden: Only the owner of a petition may delete it';
            res.status(403).send();
            return;
        }

        // Check if petition has one or more supporters
        if (petition.numberOfSupporters >= 1) {
            res.statusMessage = 'Forbidden: Cannot delete petition with one or more supporters';
            res.status(403).send();
            return
        }

        // Delete petiton
        await petitions.deletePetition(parseInt(petitionId, 10));
        res.statusMessage = 'OK';
        res.status(200).send();

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        res.statusMessage = 'OK';
        res.status(200).send(await categories.getAll());
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};