const prisma = require('../../config/prisma');

async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
}

async function createUser(data) {
  return prisma.user.create({
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
}

module.exports = {
  findByEmail,
  findById,
  createUser
};
