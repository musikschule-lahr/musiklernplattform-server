const resolvers = {
  Query: {
    getTimetable: async (obj, args, context, info) => {
      const user = await context.dataSources.prisma.user.getUser(
        { where: { keycloakUserId: context.kauth.accessToken.content.sub } },
      );
      const timetable = await context.dataSources.prisma.timetable.getTimetable(
        { where: { userId: user.id } },
      );
      return timetable;
    },
  },
  Mutation: {
    addTimeslotUser: async (obj, args, context, info) => {
      const timeslot = await context.dataSources.prisma.timetable.addTimeslotUser(
        args,
      );
      return timeslot;
    },
    addTimeslotGroup: async (obj, args, context, info) => {
      const timeslot = await context.dataSources.prisma.timetable.addTimeslotGroup(
        args,
      );
      return timeslot;
    },
    updateTimeslotTime: async (obj, args, context, info) => {
      const timeslot = await context.dataSources.prisma.timetable.updateTimeslot(
        {
          where: args.where,
          data: {
            time: args.to.time,
            day: {
              connect: args.to.day,
            },
          },
        },
      );
      return timeslot;
    },
    updateTimeslotUser: async (obj, args, context, info) => {
      const timeslot = await context.dataSources.prisma.timetable.updateTimeslotUser(
        args,
      );
      return timeslot;
    },
    updateTimeslotGroup: async (obj, args, context, info) => {
      const timeslot = await context.dataSources.prisma.timetable.updateTimeslotGroup(
        args,
      );
      return timeslot;
    },
    removeTimeslot: async (obj, args, context, info) => {
      const timeslot = await context.dataSources.prisma.timetable.removeTimeslot(args);
      return timeslot;
    },
  },
  Timetable: {
    idTimetable(parent, args, context, info) {
      return parent.id;
    },
  },
  Day: {
    idDay(parent, args, context, info) {
      return parent.id;
    },
  },
  Timeslot: {
    idTimeslot(parent, args, context, info) {
      return parent.id;
    },
  },
};

module.exports = resolvers;
