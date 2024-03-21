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


export {
    getByPetitionId
}