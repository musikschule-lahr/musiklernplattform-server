const { PubSub } = require('apollo-server-express');
const { withFilter } = require('apollo-server');

const pubsub = new PubSub();
const USER_BOARD_CHANGED = 'USER_BOARD_CHANGED';

/* eslint-disable no-underscore-dangle */
const resolvers = {
  Query: {
    getMyUserBoard: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.board.getUserBoard(
        { where: { userId: user.id } }, false,
      );
    },
    getMyCards: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return context.dataSources.prisma.board.getUserCards(
        { where: { id: user.id } },
      );
    },

    // From IDs, verification in rules
    getUserBoardFromUser: async (obj, args, context, info) => context
      .dataSources.prisma.board.getUserBoard({ where: { userId: args.where.id } }, true),
    getUserCards: async (obj, args, context, info) => context
      .dataSources.prisma.board.getUserCards(args),
    getBoardLanes: async (obj, args, context, info) => context
      .dataSources.prisma.board.getBoardLanes(args),
    getLaneCards: async (obj, args, context, info) => context
      .dataSources.prisma.board.getLaneCards(args),

    // Group
    getGroupBoard: async (obj, args, context, info) => context
      .dataSources.prisma.board.getGroupBoard(args),
  },
  Mutation: {
    addUserCard: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const { card, cardLane } = await context
        .dataSources.prisma.board.addUserCard({ ...args, addedBy: { id: user.id } });
      card.lane = { id: args.to.lane.id };
      pubsub.publish(USER_BOARD_CHANGED, {
        userBoardChanged:
        {
          initiatedBy: user.id,
          changedUser: cardLane.lane.board.user.id,
          messages:
        [{
          type: 'LANE_CHANGED',
          changedId: cardLane.lane.id,
        }],
        },
      });
      return card;
    },
    addGroupCard: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const { card, lanes } = await context
        .dataSources.prisma.board.addGroupCard({ ...args, addedBy: { id: user.id } });
      card.lane = { id: args.to.lane.id };
      lanes.forEach((lane) => {
        pubsub.publish(USER_BOARD_CHANGED, {
          userBoardChanged:
          {
            initiatedBy: user.id,
            changedUser: lane.board.user.id,
            messages:
          [{
            type: 'LANE_CHANGED',
            changedId: args.to.lane.id,
          }],
          },
        });
      });

      return card;
    },
    moveCard: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const moved = await context.dataSources.prisma.board.moveCard(args);
      pubsub.publish(USER_BOARD_CHANGED, {
        userBoardChanged:
        {
          initiatedBy: user.id,
          changedUser: user.id,
          messages: [{
            type: 'LANE_CHANGED',
            changedId: args.where.lane.id,
          },
          {
            type: 'LANE_CHANGED',
            changedId: args.to.lane.id,
          },
          {
            type: 'CARD_CHANGED',
            changedId: args.where.card.id,
          },
          ],
        },
      });
      return moved;
    },
    updateCardContent: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const cardData = await context
        .dataSources.prisma.board.updateCardContent({ ...args, updatedBy: { id: user.id } });
      cardData.lanes.forEach((lane) => {
        if (lane.lane.board.user !== null) {
          pubsub.publish(USER_BOARD_CHANGED, {
            userBoardChanged:
        {
          initiatedBy: user.id,
          changedUser: lane.lane.board.user.id,
          messages: [{
            type: 'CARD_CHANGED',
            changedId: args.where.id,
          },
          ],
        },
          });
        }
      });
      return cardData.card;
    },
    removeCard: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const removeData = await context.dataSources.prisma.board.removeCard(args);
      removeData.lanes.forEach((lane) => {
        if (lane.lane.board.user !== null) {
          pubsub.publish(USER_BOARD_CHANGED, {
            userBoardChanged:
        {
          initiatedBy: user.id,
          changedUser: lane.lane.board.user.id,
          messages: [{
            type: 'CARD_CHANGED',
            changedId: args.where.id,
          },
          ],
        },
          });
        }
      });
      return true;
    },
  },
  Subscription: {
    userBoardChanged: {
      resolve: (payload, variables) => {
        const newPL = { ...payload.userBoardChanged, user: variables.where.id };
        return newPL;
      },
      subscribe: withFilter(() => pubsub.asyncIterator(USER_BOARD_CHANGED),
        async (payload, variables) => {
          if (variables.where.id === payload.userBoardChanged.changedUser) return true;
        }),
    },
    userBoardGotExternalCard: {
      resolve: (payload, variables) => {
        const newPL = { ...payload.userBoardChanged, user: variables.where.id };
        return newPL;
      },
      subscribe: withFilter(() => pubsub.asyncIterator(USER_BOARD_CHANGED),
        async (payload, variables) => {
          if (variables.where.id === payload.userBoardChanged.changedUser
            && variables.where.id !== payload.userBoardChanged.initiatedBy) {
            return true;
          }
        }),
    },
  },
  // Feingranulare Resolver:
  User: {
    board(parent, args, context, info) {
      return context.dataSources.prisma.board.getUserBoard({ where: { userId: parent.id } }, true);
    },
    createdCards(parent, args, context, info) {
      return context.dataSources.prisma.board.getUserCreatedCards({ where: { id: parent.id } });
    },
    updatedCards(parent, args, context, info) {
      return context.dataSources.prisma.board.getUserUpdatedCards({ where: { id: parent.id } });
    },
  },
  Board: {
    __resolveType(parent, args, context, info) {
      // Für Interface
      if (parent.userId) {
        return 'UserBoard';
      }
      if (parent.groupId) {
        return 'GroupBoard';
      }
      return null;
    },
  },
  UserBoard: {
    __resolveType(parent, args, context, info) {
      return 'UserBoard';
    },
    idBoard(parent, args, context, info) {
      return parent.id;
    },
    user(parent, args, context, info) {
      if (parent.user) return parent.user;
      return context.dataSources.prisma.board.getBoardUser({ where: { id: parent.id } });
    },
    lanes(parent, args, context, info) {
      if (parent.lanes) return parent.lanes;
      return context.dataSources.prisma.board.getBoardLanes({ where: { id: parent.id } });
    },
  },
  Lane: {
    idLane(parent, args, context, info) {
      return parent.id;
    },
    cards(parent, args, context, info) {
      if (parent.cards) return parent.cards;
      return context.dataSources.prisma.board.getLaneCards({ where: { id: parent.id } });
    },
  },
  Card: {
    idCard(parent, args, context, info) {
      return parent.id;
    },
  },
};

module.exports = resolvers;
