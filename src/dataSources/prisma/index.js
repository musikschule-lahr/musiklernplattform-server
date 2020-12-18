const { PrismaClient } = require('@prisma/client');
const UserPrismaSource = require('./userPrismaSource');
const BoardPrismaSource = require('./boardPrismaSource');
const GroupPrismaSource = require('./groupPrismaSource');
const RelationPrismaSource = require('./relationPrismaSource');
const TimetablePrismaSource = require('./timetablePrismaSource');
const LibPrismaSource = require('./libPrismaSource');
const SearchPrismaSource = require('./searchPrismaSource');

const prisma = new PrismaClient();

const prismaSources = {
  user: new UserPrismaSource(prisma),
  board: new BoardPrismaSource(prisma),
  group: new GroupPrismaSource(prisma),
  relation: new RelationPrismaSource(prisma),
  timetable: new TimetablePrismaSource(prisma),
  lib: new LibPrismaSource(prisma),
  search: new SearchPrismaSource(prisma),
};

module.exports = prismaSources;
