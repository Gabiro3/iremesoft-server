const Joi = require('joi');
const { generate: uniqueId } = require('shortid');
const mongoose = require('mongoose');

const register = async (req, res, { userModel }) => {
  const UserPasswordModel = mongoose.model(userModel + 'Password');
  const UserModel = mongoose.model(userModel);
  const { email, password, role, name } = req.body;

  // Validate input
  const objectSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: true } })
      .required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin', 'owner').default('user'),
  });

  const { error } = objectSchema.validate({ email, password, role });
  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      error: error.details,
      message: 'Invalid input data.',
    });
  }

  // Check if the user already exists
  const existingUser = await UserModel.findOne({ email: email, removed: false });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'User with this email already exists.',
    });
  }

  // Create a new user
  try {
    // Generate salt and hashed password
    const salt = uniqueId();
    const newUserPassword = new UserPasswordModel();
    const passwordHash = newUserPassword.generateHash(salt, password);

    // Create and save the user
    const newUser = new UserModel({
      name,
      email,
      role, // Assign role, default is 'user'
      enabled: true,
      removed: false,
    });

    const savedUser = await newUser.save();

    // Save the hashed password with the user
    const newPassword = new UserPasswordModel({
      user: savedUser._id,
      name: name,
      password: passwordHash,
      salt,
      emailVerified: false, // Can be set to true depending on the flow
      removed: false,
    });

    await newPassword.save();

    // Send success response
    return res.status(201).json({
      success: true,
      result: savedUser,
      message: 'Account created successfully. Proceed to login',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error during user registration.',
      error: err.message,
    });
  }
};

module.exports = register;
