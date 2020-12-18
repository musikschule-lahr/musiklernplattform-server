const { rule, inputRule } = require('graphql-shield');
const {
  generateCustomError, getUserFromToken, getSpecificRelation, getDetailedRelations, getRelation, getAnyUserRelations,
} = require('../helpers');

// Existiert KEINE Teacher-Student Relation? Schülersicht
const teacherStudentRelationFromStudentDoesNotExist = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
    const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
    // context, userId, relatedId, instrumentId, userRole, relatedUserRole,
    const relation = await getDetailedRelations(
      context, args.user.id, user.id, args.instrument.id, 'Teacher', 'Student',
    );
    return (relation.length < 1);
  },
);

// Existiert KEINE Teacher-Student Relation? Lehrersicht
const teacherStudentRelationFromTeacherDoesNotExist = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
    const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
    // context, userId, relatedId, instrumentId, userRole, relatedUserRole,
    const relation = await getDetailedRelations(
      context, user.id, args.user.id, args.instrument.id, 'Teacher', 'Student',
    );
    return (relation.length < 1);
  },
);

// Hat der Nutzer bestätigte Relations?
const hasConfirmedRelationAsUser = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
    const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
    const relations = await getAnyUserRelations(context, user.id, args.where.id);
    return relations.length > 0;
  },
);

// Hat der Nutzer bestätigte Relations? Schülersicht
const hasConfirmedRelationAsRelatedUser = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    if (!context.kauth.accessToken) return generateCustomError('No Access Token', 'UNAUTHENTICATED');
    const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
    const relations = await getAnyUserRelations(context, args.where.id, user.id);
    return relations.length > 0;
  },
);

// TODO: How to check requested fields? -> I think there was a plugin...
const doesntAskPrivateData = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => true,
);

// Ist user an einer Relation beteiligt?
const relationInputIsOfRequestingUser = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
    const relation = await getSpecificRelation(context, args.where.id);
    return (relation.user.id === user.id || relation.relatedUser.id === user.id);
  },
);

// Darf User eine Relation confirmen?
const canConfirmRelation = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    const user = await getUserFromToken(context, context.kauth.accessToken.content.sub);
    const relation = await getSpecificRelation(context, args.where.id);
    switch (relation.userRole) {
      case 'Teacher': {
        return relation.user.id === user.id;
      }
      case 'Parent': {
        return relation.relatedUser.id === user.id;
      }
      default: return false;
    }
  },
);

module.exports = {
  teacherStudentRelationFromStudentDoesNotExist,
  teacherStudentRelationFromTeacherDoesNotExist,
  hasConfirmedRelationAsUser,
  hasConfirmedRelationAsRelatedUser,
  doesntAskPrivateData,
  relationInputIsOfRequestingUser,
  canConfirmRelation,
};
