type User = {
    id: number,
    email: string,
    firstName: string,
    lastName: string,
    image_filename: string,
    password: string, // Hash - not actual password
    auth_token: string
}