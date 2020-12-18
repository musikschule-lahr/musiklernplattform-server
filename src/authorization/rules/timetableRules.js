const { rule, inputRule } = require('graphql-shield');
const {
  generateCustomError, getUserFromToken, getGroup, getRelation,
} = require('../helpers');

// Ist der Input für den Eintrag vom TT-Admin?
const dayTimeInputIsOfAdministeringUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const day = await context.prisma.day.findOne({
    where: { id: args.where.day.id },
    include: { timetable: { include: { user: true } } },
  });
  return day.timetable.user.id === user.id;
});

// Gehört der Timeslot dem TT-Admin?
const timeslotInputIsOfAdministeringUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const timeslot = await context.prisma.timeslot.findOne({
    where: { id: args.where.id },
    include: { user: true, group: { include: { owner: true } } },
  });
  if (timeslot.user) {
    const relation = await getRelation(context, timeslot.user.id);
    return (relation.length > 0);
  }
  if (timeslot.group) {
    return user.id === timeslot.group.owner.id;
  }
  return false;
});

// Ist für den Timeslot der Admin Owner der Gruppe die er hinzufügen möchte?
const timetableGroupInputIsOfAdministeringUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
  const group = await getGroup(context, args.group.id);
  return user.id === group.owner.id;
});

// Ist für den Timeslot der Admin mit dem User related?
const timetableUserInputIsRelatedUser = rule({ cache: 'contextual' })(async (parent, args, context, info) => {
  if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
  const relation = await getRelation(context, args.user.id);
  return (relation.length > 0);
});

module.exports = {
  dayTimeInputIsOfAdministeringUser,
  timeslotInputIsOfAdministeringUser,
  timetableGroupInputIsOfAdministeringUser,
  timetableUserInputIsRelatedUser,
};
