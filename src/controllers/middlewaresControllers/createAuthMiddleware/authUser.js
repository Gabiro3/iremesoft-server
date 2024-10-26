const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getCompanyData } = require('@/sql/CRUD');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  try {
    // Check if password matches
    const isMatch = await bcrypt.compare(
      databasePassword.salt + password,
      databasePassword.password
    );

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Invalid credentials.',
      });
    }

    // If password matches, generate JWT token
    const token = jwt.sign(
      { id: user._id.toString() }, // Convert ObjectId to string
      process.env.JWT_SECRET,
      { expiresIn: req.body.remember ? 365 * 24 + 'h' : '24h' }
    );

    // Update logged sessions
    await UserPasswordModel.findOneAndUpdate(
      { user: user._id },
      { $push: { loggedSessions: token } },
      { new: true }
    ).exec();

    // Fetch company data
    const companyData = await getCompanyData(user._id.toString());
    req.session.companyData = companyData;

    // If no company data is found
    if (!companyData) {
      return res.status(200).json({
        success: true,
        result: {
          _id: user._id.toString(), // Ensure ID is sent as string
          name: user.name,
          surname: user.surname,
          role: user.role,
          email: user.email,
          photo: user.photo,
          token: token,
          maxAge: req.body.remember ? 365 : null,
        },
        message: 'Welcome, now setup company details in the Settings tab.',
      });
    }

    // Send the response with user and company data
    return res.status(200).json({
      success: true,
      result: {
        _id: user._id.toString(), // Ensure ID is sent as string
        name: user.name,
        surname: user.surname,
        role: user.role,
        email: user.email,
        photo: user.photo,
        token: token,
        maxAge: req.body.remember ? 365 : null,
      },
      message: 'Successfully logged in user',
    });
  } catch (error) {
    console.error('Error in authUser:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error. Please try again later.',
    });
  }
};

module.exports = authUser;
