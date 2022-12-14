/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import db from '../Database/db.js';
import { userSchema } from '../Schemas/signUpValidation.js';
import { userSchemaLogin } from '../Schemas/signInValidation.js';

async function registerUser(req, res) {
  const { name, email, password } = req.body;
  const validation = userSchema.validate(req.body);
  const hasEmail = await db.collection('users').findOne({ email });

  if (validation.error) {
    const errorList = validation.error.details
      .map((err) => err.message)
      .join('\n');
    return res.status(400).send(errorList);
  }

  if (hasEmail) {
    return res
      .status(409)
      .send(
        'Já existe um usuário com este e-mail.\nPor gentileza, revise o e-mail informado ou faça seu login'
      );
  }

  const encryptedPassword = bcrypt.hashSync(password, 10);

  try {
    await db.collection('users').insertOne({
      name,
      email,
      password: encryptedPassword,
      shopHistory: [],
    });
    return res.sendStatus(201);
  } catch (error) {
    return res.send(error.message);
  }
}

async function loginUser(req, res) {
  const user = req.body;
  const validation = userSchemaLogin.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errorList = validation.error.details
      .map((err) => err.message)
      .join('\n');
    return res.status(400).send(errorList);
  }

  try {
    const checkUser = await db
      .collection('users')
      .findOne({ email: user.email });

    if (!checkUser) {
      return res.status(422).send('Email ou senha inválidos.');
    }

    const decryptedPassword = bcrypt.compareSync(
      user.password,
      checkUser.password
    );

    if (decryptedPassword) {
      const token = uuid();
      await db.collection('sessions').insertOne({
        token,
        userId: checkUser._id,
      });

      return res.status(200).send({
        token,
        name: checkUser.name,
        userId: checkUser._id.toString(),
      });
    }
    return res.status(401).send('Email ou senha inválidos.');
  } catch (error) {
    return res.send(error.message);
  }
}

async function removeUserSession(req, res) {
  const { token } = req.params;

  try {
    await db.collection('sessions').deleteOne({ token });
    return res.sendStatus(200);
  } catch (error) {
    return res.send(error.message);
  }
}

export { registerUser, loginUser, removeUserSession };
