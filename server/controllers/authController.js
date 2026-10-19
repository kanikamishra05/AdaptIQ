const User = require('../models/User');
const { generateTokens, setTokenCookies, clearTokenCookies } = require('../utils/jwt');

// Register a new user
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed. Email might already be in use.' // Vague for security, but usually "Email already in use" is acceptable for signup
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Generate tokens and set cookies
    const { accessToken, refreshToken } = generateTokens(user);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login existing user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate tokens and set cookies
    const { accessToken, refreshToken } = generateTokens(user);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
const logout = (req, res) => {
  clearTokenCookies(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get current user profile
const getMe = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Not authorized, no refresh token provided' });
    }

    const { verifyRefreshToken } = require('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    // Generate new tokens and set cookies
    const { accessToken, newRefreshToken } = generateTokens(user);
    setTokenCookies(res, accessToken, newRefreshToken || refreshToken);

    res.status(200).json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, refresh token failed or expired' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  refresh
};
