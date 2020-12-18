const { PubSub } = require('apollo-server-express');
const { withFilter } = require('apollo-server');

const pubsub = new PubSub();
const USER_CHANGED = 'USER_CHANGED';

const isRelated = async (userId, relatedId, context) => {
  const related = await context.dataSources.prisma.relation.getConfirmedWithRelated(
    { where: { id: userId, relatedUser: { id: relatedId } } },
  );
  return related.length > 0;
};

const resolvers = {
  Query: {
    getAllUsers: async (obj, args, context, info) => context
      .dataSources.prisma.user.getAllUsers(args),

    // From Access Token
    getUser: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return user;
    },

    // From IDs, verification in rules
    getUserFromId: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(args);
      const me = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      if (await isRelated(me.id, user.id, context)) return user;
      const {
        id, firstname, lastname, username,
      } = user;
      return {
        id, firstname, lastname, username,
      };
    },

    getSchoolByUserId: async (obj, args, context, info) => {
      const school = await context.dataSources.prisma.user.getSchoolByUserId(
        args,
      );
      return school;
    },
    getInstruments: async (obj, args, context, info) => context
      .dataSources.prisma.user.getInstruments(args),
    getInstrumentFromId: async (obj, args, context, info) => context
      .dataSources.prisma.user.getInstrument(args),
    userCanUseManagement: async (obj, args, context, info) => {
      const me = await context.dataSources.prisma.user.userCanUseManagement(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return me;
    },
  },
  Mutation: {
    addUserByAdmin: async (obj, args, context, info) => {
      const user = context.dataSources.prisma.user.addUserByAdmin(
        args,
      );
        // setup keycloak account for Mail & send Mail
      return user;
    },
    addRegisteredUser: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.addRegisteredUser(
        {
          data: {
            ...args.data,
            keycloakUserId: context.kauth.accessToken.content.sub,
          },
        },
      );
      return user;
    },

    updateRegisteredUser: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.updateRegisteredUser(
        {
          where: {
            keycloakUserId: context.kauth.accessToken.content.sub,
          },
          data: {
            ...args.data,
          },
        },
      );
      pubsub.publish(USER_CHANGED, { userChanged: user });
      return user;
    },
  },
  Subscription: {
    userChanged: {
      subscribe: withFilter(() => pubsub.asyncIterator(USER_CHANGED),
        (payload, variables) => (variables.where.id === payload.userChanged.id)),
    },
  },
  User: {
    idUser(parent, args, context, info) {
      return parent.id;
    },
    instruments: async (parent, args, context, info) => {
      if (parent.playedInstruments) {
        return parent.playedInstruments;
      }
      return null;
    },
    matrixUserName: async (parent, args, context, info) => { if (parent.keycloakUserId) return `@${parent.keycloakUserId}:erna.ovh`; },
  },
  Instrument: {
    idInstrument(parent, args, context, info) {
      return parent.id;
    },
  },
};

module.exports = resolvers;
