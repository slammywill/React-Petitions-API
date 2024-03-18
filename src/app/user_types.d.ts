type User = {
    id: number,
    email: string,
    first_name: string,
    last_name: string,
    image_filename: string,
    password: string, // Hash - not actual password
    auth_token: string
}