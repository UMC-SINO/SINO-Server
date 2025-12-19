import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class UserRepository {
  async findByName(name) {
    return prisma.user.findUnique({
      where: { name },
    });
  }

  async existsByName(name) {
    const user = await prisma.user.findUnique({
      where: { name },
    });
    return !!user;
  }

  async create(name) {
    return prisma.user.create({
      data: { name },
    });
  }
}

const userRepository = new UserRepository();
export default userRepository;
