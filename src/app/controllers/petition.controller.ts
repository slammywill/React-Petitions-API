import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model';
import * as support_tiers from '../models/support_tier.model';
import * as categories from '../models/cateory.model';
import {validate} from "../resources/validate";
import * as schemas from "../resources/schemas.json";

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
        if (token === null) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }

        const category = await categories.getById(categoryId);
        Logger.info(category);
        if (category.length === 0) {
            res.statusMessage = `Bad Request: Category with id ${categoryId} does not exist`;
            res.status(400).send();
            return;
        }

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

const editPetition = async (req: Request, res: Response): Promise<void> => {
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

const deletePetition = async (req: Request, res: Response): Promise<void> => {
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