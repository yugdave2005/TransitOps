const authRepo = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');

async function register({ email, password, name, role = 'DRIVER' }) {
  const existing = await authRepo.findByEmail(email);
  if (existing) {
    const error = new Error('User with this email already exists.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);
  const user = await authRepo.createUser({
    email,
    passwordHash,
    name,
    role
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user, token };
}

async function login({ email, password }) {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const userProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  };

  return { user: userProfile, token };
}

async function getProfile(userId) {
  const user = await authRepo.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }
  return user;
}

module.exports = {
  register,
  login,
  getProfile
};
