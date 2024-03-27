import {knexInstance} from "../../config/db";

const getAll = async () : Promise<Category[]> => {
    return (await knexInstance.select('id', 'name')
        .from('category'));
}

const getById = async  (id:number) : Promise<Category[]> => {
    return (await knexInstance.select('id as categoryId', 'name')
        .from('category')
        .where('id', id));
}

export {
    getAll, getById
}