const { DataSource } = require('apollo-datasource');

// Prisma Source ermöglicht gleiches Prisma für alle Module
class PrismaSource extends DataSource {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }
}

module.exports = PrismaSource;
