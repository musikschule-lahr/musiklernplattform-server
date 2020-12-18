async function getUserFromToken(context, kcId) {
  return context.dataSources.prisma.user.getUser(
    { where: { keycloakUserId: kcId } },
  );
}

async function getRelation(context, relatedId) {
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const relation = await context.prisma.userRelated.findMany({
    where: {
      user: {
        id: user.id,
      },
      relatedUser: {
        id: relatedId,
      },
    },
  });
  return relation;
}
async function getInstrumentsFromIds(context, instruments) {
  const instrumentsFound = await context.prisma.instrument.findMany(
    { where: { OR: [...instruments] } },
  );
  return instrumentsFound;
}

const plansList = {
  NONE: 0,
  STUDENT: 1,
  TEACHER: 2,
  PARENT: 3,
  OFFICE: 4,
};

const getPlans = async (context) => {
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  if ((user.relatedTo || []).length > 0) {
    if (user.relatedTo.some((e) => e.userRole.toUpperCase() === 'OFFICE')) {
      return plansList.TEACHER;
    }
    if (user.relatedTo.some((e) => e.userRole.toUpperCase() === 'TEACHER')) {
      return plansList.STUDENT;
    }
    if (user.relatedTo.some((e) => e.userRole.toUpperCase() === 'PARENT')) {
      return plansList.STUDENT;
    }
  }
  if ((user.relatedBy || []).length > 0) {
    if (user.relatedBy.some((e) => e.userRole.toUpperCase() === 'PARENT')) {
      return plansList.PARENT;
    }
  }
  return plansList.NONE;
};

module.exports = {
  getUserFromToken,
  getRelation,
  getInstrumentsFromIds,
  getPlans,
  plansList,
};
