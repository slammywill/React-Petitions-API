import { Request, Response } from "express";
import * as schemas from "../resources/schemas.json";
import * as users from "../models/user.model";
import { validate } from "../resources/validate";
import Logger from "../../config/logger";
import * as passwords from "../services/passwords";
import jwt, {JwtPayload} from "jsonwebtoken";
import { getUserById } from "../models/user.model";
const register = async (req: Request, res: Response): Promise<void> => {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const password = req.body.password;
  const hashedPassword = await passwords.hash(password);

  // Checks that the provided data is valid.
  Logger.http("POST: Register a new user");
  const validation = await validate(schemas.user_register, req.body);
  if (validation !== true) {
    res.statusMessage = `Bad request: Invalid information`;
    res.status(400).send();
    return;
  }
  try {
    // Checks if the email is already in use.
    const emailTakenResult = await users.getUserByEmail(email);
    if (emailTakenResult.length !== 0) {
      res.statusMessage = "Forbidden: Email already in use";
      res.status(403).send();
      return;
    }
    // Adds the new user.
    const addUserResult = await users.insert(
      email,
      firstName,
      lastName,
      hashedPassword,
    );
    res.statusMessage = `Created`;
    res.status(201).send({ "userId": addUserResult.insertId });
  } catch (err) {
    Logger.error(err);
    res.statusMessage = "Internal Server Error";
    res.status(500).send();
    return;
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = await passwords.hash(password);
  try {
    // Checks if a user exists with the provided email.
    const result = await users.getUserByEmail(email);
    if (result.length === 0) {
      res.statusMessage = "Unauthorized. Incorrect email/password";
      res.status(401).send();
      return;
    }
    // Checks that the provided password is correct for the user.
    const user = result[0];
    const id = user.id;
    const passwordMatch = await passwords.compare(
      user.password,
      hashedPassword,
    );
    if (!passwordMatch) {
      res.statusMessage = "Unauthorized. Incorrect email/password";
      res.status(401).send();
      return;
    }
    // Generates the auth token for the user and sets it to the user.
    const token = jwt.sign({ id }, "secret-key");
    const tokenUpdateResult = await users.updateToken(id, token);
    Logger.info(`Auth token for ${user.id} updated`);
    res.statusMessage = `OK`;
    res.status(200).send({ "userId": id, "token": token });

  } catch (err) {
    Logger.error(err);
    res.statusMessage = "Internal Server Error";
    res.status(500).send();
    return;
  }
};

const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.header("X-Authorization");
  try {
    // Check if the user has a auth token.
    if (token === "") {
      res.statusMessage = "Unauthorized. Cannot log out if you are not authenticated";
      res.status(401).send();
      return;
    }
    // Find the user id of the provided token.
    const decodedToken = jwt.verify(token, "secret-key");
    let tokenId = -1;
    if (typeof decodedToken === 'object') {
      tokenId = (decodedToken as JwtPayload).id;
    }
    // Checks that the user provided by the id has the same auth token as the one in the request.
    const result = await users.getUserById(tokenId);
    const user = result[0];
    if (user.auth_token !== token) {
      res.statusMessage = "Unauthorized. Cannot log out if you are not authenticated";
      res.status(401).send();
      return;
    }
    // Removes auth token from user to logout.
    await users.updateToken(tokenId, null);
    res.statusMessage = "OK";
    res.status(200).send();
  } catch (err) {
    Logger.error(err);
    res.statusMessage = "Internal Server Error";
    res.status(500).send();
    return;
  }
};

const view = async (req: Request, res: Response): Promise<void> => {
  const reqId = req.params.id;
  const token = req.header("X-Authorization");
  try {
    // Checks if the provided id is a number.
    if (isNaN(parseInt(reqId, 10))) {
      res.statusMessage = "Not Found. No user with specified ID";
      res.status(404).send();
      return;
    }
    // Checks if there is a user with the provided id.
    const result = await users.getUserById(parseInt(reqId, 10));
    if (result.length === 0) {
      res.statusMessage = "Not Found. No user with specified ID";
      res.status(404).send();
      return;
    }
    const user = result[0];
    const id = user.id;
    const email = user.email;
    const firstName = user.first_name;
    const lastName = user.last_name;
    // Gives first and last name response if the request is not authenticated.
    if (token === "") {
      res.statusMessage = `OK`;
      res.status(200).send({ "firstName": firstName, "lastName": lastName });
      return;
    }
    // Finds the user id from the provided auth token.
    const decodedToken: JwtPayload | string = jwt.decode(token);
    let tokenId = -1;
    if (typeof decodedToken === 'object') {
      tokenId = (decodedToken as JwtPayload).id;
    }

    // Checks that the id from the auth token matches the user they are requesting to view.
    // Provides email, first name and last name if so.
    if (tokenId === id) {
      res.statusMessage = `OK`;
      res.setHeader("X-Authorization", token);
      res.status(200).send({ "firstName": firstName, "lastName": lastName, "email": email, });
    } else {
      // Gives first and last name if the id from the auth token does not match the requested user.
      res.statusMessage =  `OK`;
      res.status(200).send({ "firstName": firstName, "lastName": lastName });
    }
    return;

  } catch (err) {
    Logger.error(err);
    res.statusMessage = "Internal Server Error";
    res.status(500).send();
    return;
  }
};

const update = async (req: Request, res: Response): Promise<void> => {
  try {
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
};

export { register, login, logout, view, update };
