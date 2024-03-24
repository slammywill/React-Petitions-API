import {knexInstance} from "../../config/db";

const getBySupportTierId = async (supportTierId: number) : Promise<Supporter[]> => {
    const query = knexInstance('supporter')
        .select("*")
        .where('support_tier_id', supportTierId);
    return (await query);
}

const getAllByPetitionId = async (petitionId: number) : Promise<Supporter[]> => {
    const query = knexInstance('supporter AS s')
        .leftJoin('user AS u', 's.user_id', 'u.id')
        .select(
            's.id AS supportId',
            's.support_tier_id AS supportTierId',
            's.message',
            's.user_id AS supporterId',
            'u.first_name AS supporterFirstName',
            'u.last_name AS supporterLastName',
            'timestamp'
        )
        .where('petition_id', petitionId)
        .orderBy('timestamp', 'desc');

    return (await query);
}

const getByUserIdAndPetition = async (userId: number, petitionId: number) : Promise<Supporter[]> => {
    const query = knexInstance('supporter')
        .select(
            'id',
            'user_id AS supporterId',
            'support_tier_id AS supportTierId'
            )
        .where('user_id', userId)
    .where('petition_id', petitionId);
    return (await query);
}

const insert = async (supportTierId: number, petitionId: number, userId: number, message: string) : Promise<void> => {
    const query = knexInstance('supporter')
        .insert({
            'support_tier_id': supportTierId,
            'petition_id': petitionId,
            'user_id': userId,
            'message': message
        });
    await query;
}

export {
    getBySupportTierId,
    getAllByPetitionId,
    getByUserIdAndPetition,
    insert
}