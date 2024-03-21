import {knexInstance} from "../../config/db";

const getSubset = async (
    startIndex: number,
    count: number,
    q: string,
    categoryIds: number[],
    supportingCost: number,
    ownerId: number,
    supporterId: number,
    sortBy: string) : Promise<Petition[]> => {
    const queryBuilder = knexInstance('petition AS p')
        .join('support_tier AS st', 'p.id', 'st.petition_id')
        .join('user AS u', 'p.owner_id', 'u.id')
        .join('supporter as s', 's.petition_id', 'p.id')
        .select(
            'p.id AS petitionId',
            'p.title',
            'p.category_id AS categoryId',
            'p.owner_id AS ownerId',
            'u.first_name AS ownerFirstName',
            'u.last_name AS ownerLastName',
            knexInstance.raw('(SELECT COUNT(*) FROM supporter s WHERE s.petition_id = p.id) AS numberOfSupporters'),
            'p.creation_date AS creationDate',
            'st.cost AS supportingCost')
    queryBuilder.where((builder) => {
        if (q) {
            builder.where('p.title', 'like', `%${q}%`)
                .orWhere('p.description', 'like', `%${q}%`);
        }
    });
    if (!isNaN(ownerId)) {
        queryBuilder.where('p.owner_id', ownerId);
    }
    if (categoryIds && categoryIds.length > 0) {
        queryBuilder.whereIn('p.category_id', categoryIds);
    }
    if (!isNaN(supportingCost)) {
        queryBuilder.whereBetween('st.cost', [0, supportingCost]);
    }
    if (!isNaN(supporterId)) {
        queryBuilder.where('s.user_id', supporterId);
    }
    queryBuilder.groupBy('p.id');

    if (sortBy !== undefined) {
        if (sortBy === 'ALPHABETICAL_ASC') {
            queryBuilder.orderBy([{column: 'p.title', order: 'asc'}, 'p.id']); }
        if (sortBy === 'ALPHABETICAL_DESC') {
            queryBuilder.orderBy([{column: 'p.title', order: 'desc'}, 'p.id']); }
        if (sortBy === 'COST_ASC') {
            queryBuilder.orderByRaw('MIN(st.cost) ASC, p.id'); }
        if (sortBy === 'COST_DESC') {
            queryBuilder.orderByRaw('MIN(st.cost) DESC, p.id'); }
        if (sortBy === 'CREATED_ASC') {
            queryBuilder.orderBy([{column: 'p.creation_date', order: 'asc'}, 'p.id']); }
        if (sortBy === 'CREATED_DESC') {
            queryBuilder.orderBy([{column: 'p.creation_date', order: 'desc'}, 'p.id']); }
    } else {
        queryBuilder.orderBy([{column: 'p.creation_date', order: 'asc'}, 'p.id']);
    }
    queryBuilder.distinct();

    return (await queryBuilder);
}

const getById = async (id: number) : Promise<Petition> => {
    const query = knexInstance('petition AS p')
        .join('support_tier AS st', 'p.id', 'st.petition_id')
        .join('user AS u', 'p.owner_id', 'u.id')
        .join('supporter as s', 's.petition_id', 'p.id')
        .select(
            'p.id AS petitionID',
            'p.title AS title',
            'p.category_id AS categoryId',
            'u.id AS ownerId',
            'u.first_name AS ownerFirstName',
            'u.last_name AS ownerLastName',
            knexInstance.raw('(SELECT COUNT(*) FROM supporter s WHERE s.petition_id = p.id) AS numberOfSupporters'),
            'p.creation_date AS creationDate',
            'p.description AS description',
            knexInstance.raw('(SELECT SUM(cost) FROM support_tier s WHERE s.petition_id = p.id) AS moneyRaised'),
            )
        .where('p.id', id);
    return (await query)[0];
}

export {
    getSubset,
    getById
}
