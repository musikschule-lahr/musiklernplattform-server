const resolvers = {
  Query: {
    getGroup: async (obj, args, context, info) => {
      const groups = await context.dataSources.prisma.group.getGroup(
        args,
      );
      return groups;
    },
    getGroupsOfOwner: async (obj, args, context, info) => {
      const groups = await context.dataSources.prisma.group.getGroupsOfOwner(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return groups;
    },
    getGroupsOfUser: async (obj, args, context, info) => {
      const groups = await context.dataSources.prisma.group.getGroupsOfUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      return groups;
    },
  },
  Mutation: {
    addGroup: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const groups = await context.dataSources.prisma.group.addGroup(
        { name: args.data.name, user: user.id },
      );
      return groups;
    },
    removeGroup: async (obj, args, context, info) => {
      const groups = await context.dataSources.prisma.group.removeGroup(
        args,
      );
      return groups;
    },
    addGroupMatrixRoom: async (obj, args, context, info) => {
      await context.dataSources.prisma.group.addGroupMatrixRoom(
        {
          group: args.where.id,
          room: args.room,
        },
      );
      return true;
    },
    updateGroupUsers: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const group = await context.dataSources.prisma.group.updateGroupUsers(
        user, args,
      );
      return group;
    },
  },
  GroupBoard: {
    // eslint-disable-next-line no-underscore-dangle
    __resolveType(parent, args, context, info) {
      return 'GroupBoard';
    },
    idBoard(parent, args, context, info) {
      return parent.id;
    },
    lanes(parent, args, context, info) {
      return context.dataSources.prisma.board.getBoardLanes({ where: { id: parent.id } });
    },

  },
  Group: {
    idGroup(parent, args, context, info) {
      return parent.id;
    },
    relations(parent, args, context, info) {
      if (!parent.relations) return null;
      return parent.relations;
    },
  },

};

module.exports = resolvers;
