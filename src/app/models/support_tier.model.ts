import {knexInstance} from "../../config/db";

const getByPetitionId = async (petitionId: number) : Promise<Petition[]> => {
    const query = knexInstance.select(
        'title',
        'description',
        'cost',
        'id AS supportTierId'
    )
        .from('support_tier')
        .where('petition_id', petitionId);

    return (await query);
}

const insert = async (petitionId: number, title: string, description: string, cost: number) : Promise<void> => {
    const query = knexInstance('support_tier')
        .insert({
            'petition_id': petitionId,
            'title': title,
            'description': description,
            'cost': cost
        });
    await query;
}

const getByTitle = async (title: string, petitionId: number) : Promise<SupportTier[]> => {
    const query = knexInstance('support_tier')
        .select("*")
        .where('petition_id', petitionId)
    .where('title', title);
    return (await query);
}

const getById = async (id: number) : Promise<SupportTier[]> => {
    const query = knexInstance('support_tier')
        .select("*")
        .where("id", id);
    return (await query);
}

const updateTitle = async (id: number, title: string) : Promise<void> => {
    const query = knexInstance('support_tier')
        .where('id', id)
    .update('title', title);
    await query;
}

const updateDescription = async (id: number, description: string) : Promise<void> => {
    const query = knexInstance('support_tier')
        .where('id', id)
        .update('description', description);
    await query;
}

const updateCost = async (id: number, cost: number) : Promise<void> => {
    const query = knexInstance('support_tier')
        .where('id', id)
        .update('cost', cost);
    await query;
}

const deleteSupportTier = async (id: number) : Promise<void> => {
    const query = knexInstance('support_tier')
        .where('id', id)
        .delete();
}

export {
    getByPetitionId,
    getByTitle,
    getById,
    insert,
    updateDescription,
    updateTitle,
    updateCost,
    deleteSupportTier
}