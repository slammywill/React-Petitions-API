const hash = async (password: string): Promise<string> => {
    // Todo: update this to encrypt the password
    return password
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    // Todo: (suggested) update this to compare the encrypted passwords
    return (password === comp)
}

export {hash, compare}