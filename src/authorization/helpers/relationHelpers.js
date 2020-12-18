async function getDetailedRelations(
  context, userId, relatedId, instrumentId, userRole, relatedUserRole,
) {
  const relations = await context.prisma.userRelated.findMany({
    where: {
      userId,
      relatedUserId: relatedId,
      instrumentId,
      userRole,
      relatedUserRole,
    },
  });
  return relations;
}

async function getAnyUserRelations(
  context, user, related,
) {
  const relations = await context.prisma.userRelated.findMany({
    where: {
      userId: user,
      relatedUserId: related,
      NOT: { confirmedAt: null },
    },
  });
  return relations;
}
async function getSpecificRelation(context, relationId) {
  const relatedUsers = await context.prisma.userRelated.findOne({
    where: {
      id: relationId,
    },
    include: {
      user: true,
      relatedUser: true,
    },
  });
  return relatedUsers;
}

module.exports = {
  getDetailedRelations,
  getAnyUserRelations,
  getSpecificRelation,
};
