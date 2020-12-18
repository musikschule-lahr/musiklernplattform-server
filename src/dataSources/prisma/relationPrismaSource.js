const { reduceBy } = require('ramda');
const PrismaSource = require('./PrismaSource');

const removeTimeslots = async (userId, relatedUserId, prisma) => {
  const count = await prisma.userRelated.count({
    where: {
      OR: [{
        userId,
        relatedUserId,
      },
        /*   {
        userId: relatedUserId,
        relatedUserId: userId,
      } */ ],
    },
  });
  if (count < 2) {
    await prisma.timeslot.deleteMany({
      where: {
        AND: [
          {
            OR: [{
              studentId: relatedUserId,
            }],
          },
          {
            day: {
              timetable: {
                user: {
                  id: userId,
                },
              },
            },
          },
        ],
      },

    });
  }
};

async function groupRelatedUsers(relatedUsers) {
  const toGroupName = ({
    relatedUserId, relatedUserRole, userId, userRole,
  }) => [relatedUserId, relatedUserRole, userId, userRole].join('#');
  const groupRelations = reduceBy(
    (groupRelation, {
      id, instrumentId, instrument, confirmedInstruments, instrumentRelationIds,
      group, groupId, confirmedGroups, isConfirmed, groupRelationIds, ...fields
    }) => {
      const result = {
        ...groupRelation,
        ...fields,
      };
      if (result.confirmedAt != null) { result.isConfirmed = true; }
      if (instrumentId !== null) {
        result.instrumentIds = groupRelation.instrumentIds.concat(instrumentId);
        result.instruments = groupRelation.instruments.concat(instrument);
        result.instrumentRelationIds = groupRelation.instrumentRelationIds.concat(id);
        result.confirmedInstruments = groupRelation.confirmedInstruments
          .concat(result.confirmedAt != null);
      }
      if (groupId !== null) {
        result.groups = groupRelation.groups.concat(group);
        result.groupIds = groupRelation.groupIds.concat(groupId);
        result.groupRelationIds = groupRelation.groupRelationIds.concat(id);
        result.confirmedGroups = groupRelation.confirmedGroups.concat(result.confirmedAt != null);
      }
      return result;
    },
    {
      instrumentIds: [],
      instruments: [],
      confirmedInstruments: [],
      instrumentRelationIds: [],
      groups: [],
      confirmedGroups: [],
      groupIds: [],
      groupRelationIds: [],
      isConfirmed: false,
    },
    toGroupName,
  );
  const groupedRelatedUsers = Object.values(groupRelations(relatedUsers));
  return groupedRelatedUsers;
}

class RelationSource extends PrismaSource {
  async getSingleRelation(args) {
    const relatedUser = await this.prisma.userRelated.findFirst({
      where: {
        id: args.id,
      },
      include: {
        user: true,
        relatedUser: true,
        instrument: true,
        group: {
          include: {
            owner: true,
          },
        },
      },
    });
    return relatedUser;
  }

  async getRelatedUsers(args, showOnlyConfirmed, showOnlyUnconfirmed, dontAggregate) {
    const where = {
      user: {
        id: args.where.id,
      },
      userRole: args.where.ownRole,
      relatedUserRole: args.where.relatedRole,
    };
    if (showOnlyConfirmed) where.NOT = { confirmedAt: null }; // default ist null
    else if (showOnlyUnconfirmed) where.confirmedAt = null;
    const relatedUsers = await this.prisma.userRelated.findMany({
      where,
      include: {
        user: true,
        relatedUser: true,
        instrument: true,
        group: {
          include: {
            owner: true,
          },
        },
      },
    });
    if (dontAggregate) {
      return relatedUsers;
    }
    const groupedRelatedUsers = await groupRelatedUsers(relatedUsers);
    return groupedRelatedUsers;
  }

  async getSingleRelationFromUser(args) {
    const where = {
      userId: args.where.myId,
      relatedUserId: args.where.user.id,
      userRole: args.where.ownRole,
      relatedUserRole: args.where.relatedRole,
    };
    if (args.group) where.groupId = args.group.id;
    if (args.instrument) where.instrumentId = args.instrument.id;
    const relatedUser = await this.prisma.userRelated.findFirst({
      where,
      include: {
        user: true,
        relatedUser: true,
        instrument: true,
        group: {
          include: {
            owner: true,
          },
        },
      },
    });
    return relatedUser;
  }

  async getSingleRelationFromUserRelated(args) {
    const where = {
      userId: args.where.user.id,
      relatedUserId: args.where.myId,
      userRole: args.where.ownRole,
      relatedUserRole: args.where.relatedRole,
    };
    if (args.where.group) where.groupId = args.where.group.id;
    if (args.where.instrument) where.instrumentId = args.where.instrument.id;
    const relatedUser = await this.prisma.userRelated.findFirst({
      where,
      include: {
        user: true,
        relatedUser: true,
        instrument: true,
        group: {
          include: {
            owner: true,
          },
        },
      },
    });
    return relatedUser;
  }

  async getRelatedUsersFromRelated(args, showOnlyConfirmed, showOnlyUnconfirmed, dontAggregate) {
    const where = {
      relatedUser: {
        id: args.where.id,
      },
      userRole: args.where.mainRole,
      relatedUserRole: args.where.relatedRole,
    };
    if (showOnlyConfirmed) where.NOT = { confirmedAt: null };
    else if (showOnlyUnconfirmed) where.confirmedAt = null;
    const relatedUsers = await this.prisma.userRelated.findMany({
      where,
      include: {
        user: true,
        relatedUser: true,
        instrument: true,
        group: {
          include: {
            owner: true,
          },
        },
      },
    });
    if (dontAggregate) {
      return relatedUsers;
    }
    const groupedRelatedUsers = await groupRelatedUsers(relatedUsers);
    return groupedRelatedUsers;
  }

  async getConfirmedWithRelated(args) {
    const where = {
      userId: args.where.id,
      relatedUserId: args.where.relatedUserId,
      NOT: { confirmedAt: null },
    };
    if (args.where.ownRole) where.userRole = args.where.ownRole;
    if (args.where.relatedRole) where.relatedUserRole = args.where.relatedRole;
    const relatedUsers = await this.prisma.userRelated.findMany({
      where,
      include: {
        user: true,
        relatedUser: true,
        instrument: true,
        group: true,
      },
    });
    return relatedUsers;
  }

  // Spezialfall: Wir wollen die unconfirmed Members einer Groups eines Teachers
  async getMyUnconfirmedGroupStudents(args) {
    const where = {
      userId: args.where.id,
      userRole: 'Teacher',
      relatedUserRole: 'Student',
      confirmedAt: null,
      NOT: { group: null },

    };
    if (args.group) {
      where.group = {
        id: args.where.group,
      };
    }
    const relatedUsers = await this.prisma.userRelated.findMany({
      where,
      include: {
        user: true,
        relatedUser: true,
        group: {
          include: {
            owner: true,
          },
        },
      },
    });
    return relatedUsers;
  }

  // Spezialfall: Wir wollen die unconfirmed Lessons eines Teachers
  async getUnconfirmedRelatedTeacherLessons(args) {
    const relatedUsers = await this.prisma.userRelated.findMany({
      where: {
        userId: args.where.id,
        userRole: 'Teacher',
        relatedUserRole: 'Student',
        confirmedAt: null,
        NOT: { instrument: null },
      },
      include: {
        user: true,
        relatedUser: true,
        instrument: true,
      },
    });
    const groupedRelatedUsers = await groupRelatedUsers(relatedUsers);
    return groupedRelatedUsers;
  }

  // Alle UserRelations die NUR in Verbindung mit einer Gruppe stehen
  async getMyOnlyGroupRelatedStudents(args) {
    const relatedUsers = await this.prisma.userRelated.findMany({
      where: {
        group: args.where.group,
      },
      include: {
        relatedUser: true,
      },
    });
    const existOnce = async (relatedUser) => {
      const count = await this.prisma.userRelated.count({
        where: {
          AND: {
            relatedUserId: relatedUser.relatedUser.id,
            NOT: { matrixRoomId: null },
          },
        },
      });
      return (count < 2);
    };
    const filtered = [];
    const promises = relatedUsers.map(async (relatedUser) => {
      const existsOnce = await existOnce(relatedUser);
      if (existsOnce) filtered.push(relatedUser);
    });
    await Promise.all(promises);
    return filtered;
  }

  async addRelatedUser(args) {
    const data = {
      user: {
        connect: { id: args.user },
      },
      relatedUser: {
        connect: { id: args.relatedUser },
      },
      userRole: args.userRole,
      relatedUserRole: args.relatedRole,
    };
    if (args.instrument) {
      data.instrument = {
        connect: { id: args.instrument },
      };
    }
    if (args.group) {
      data.group = {
        connect: { id: args.group },
      };
    }
    const relatedUser = this.prisma.userRelated.create({
      data,
      include: {
        user: true,
        relatedUser: true,
      },
    });
    return relatedUser;
  }

  async removeRelation(args) {
    const where = {
      userId: args.user,
      relatedUserId: args.relatedUser,
      userRole: args.userRole,
      relatedUserRole: args.relatedRole,
    };
    if (args.instrument) {
      where.instrumentId = args.instrument;
    }
    if (args.group) {
      where.groupId = args.group;
    }
    const relation = await this.prisma.userRelated.findFirst({
      where,
    });
    if (relation) {
      if (args.relatedRole === 'Student') {
        await removeTimeslots(args.user, args.relatedUser, this.prisma);
      }
      await this.prisma.userRelated.delete({
        where: { id: relation.id },
      });
      return relation;
    }
    return new Error("Couldn't delete record");
    // throw error
  }

  async addTeachedInstruments(args) {
    const user = await this.prisma.user.update({
      where: { id: args.user },
      data: {
        teachedInstruments: {
          connect: args.data,
        },
      },
      include: {
        teachedInstruments: true,
      },
    });
    return user;
  }

  async removeTeachedInstruments(args) {
    const user = await this.prisma.user.update({
      where: { id: args.user },
      data: {
        teachedInstruments: {
          disconnect: args.data,
        },
      },
      include: {
        teachedInstruments: true,
      },
    });
    await args.data.forEach(async (data) => {
      const relations = await this.prisma.userRelated.findMany({
        where: {
          userId: args.user.id,
          userRole: 'Teacher',
          instrumentId: data.id,
        },
      });
      await relations.forEach(async (relation) => {
        await this.prisma.userRelated.delete({
          where: { id: relation.id },
        });
      });
    });
    return user;
  }

  async confirmStudentRelations(args) {
    const relations = [];
    args.data.forEach(async (relation) => {
      const newRelation = await this.prisma.userRelated.updateMany({
        where: {
          userId: args.user,
          instrumentId: relation.instrument.id,
          relatedUserId: relation.user.id,
          userRole: 'Teacher',
          relatedUserRole: 'Student',
        },
        data: {
          confirmedAt: args.time,
        },
      });
      relations.push(newRelation);
    });
    return relations;
  }

  async confirmParentRelation(args) {
    const found = await this.prisma.userRelated.findFirst({
      where: {
        userId: args.user.id,
        relatedUserId: args.relatedUser,
        instrumentId: null,
        groupId: null,
        userRole: 'Parent',
        relatedUserRole: 'Student',
      },
    });
    const relation = await this.prisma.userRelated.update({
      where: {
        id: found.id,
      },
      data: {
        confirmedAt: args.time,
        matrixRoomId: args.room,
      },
    });
    return relation;
  }

  async confirmRelationFromUser(args) {
    const data = {
      confirmedAt: args.time,
    };
    if (args.room) data.matrixRoomId = args.room;
    const relation = await this.prisma.userRelated.update({
      where: {
        id: args.where.id,
      },
      data,
    });
    return relation;
  }

  async removeRelationFromUser(args) {
    const found = await this.prisma.userRelated.findFirst({
      where: {
        id: args.where.id,
      },
    });
    if (found.relatedUserRole === 'Student') {
      await removeTimeslots(found.userId, found.relatedUserId, this.prisma);
    }
    await this.prisma.userRelated.delete({
      where: {
        id: args.where.id,
      },

    });
    return found;
  }

  async addMatrixRooms(args) {
    await this.prisma.userRelated.updateMany({
      where: {
        AND: {
          userId: args.user,
          relatedUserId: args.relatedUser,
          NOT: { confirmedAt: null },
        },

      },
      data: {
        matrixRoomId: args.rooms,
      },
    });
    await this.prisma.userRelated.updateMany({
      where: {
        AND: {
          relatedUserId: args.user,
          userId: args.relatedUser,
          NOT: { confirmedAt: null },
        },

      },
      data: {
        matrixRoomId: args.rooms,
      },
    });
    return true;
  }

  async addTeacherTimetable(user) {
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        timetable: {
          create: {
            days: {
              create: [
                {
                  day: 'Monday',
                  sorting: 100,
                }, {
                  day: 'Tuesday',
                  sorting: 100,
                }, {
                  day: 'Wednesday',
                  sorting: 100,
                }, {
                  day: 'Thursday',
                  sorting: 100,
                }, {
                  day: 'Friday',
                  sorting: 100,
                }, {
                  day: 'Saturday',
                  sorting: 100,
                }, {
                  day: 'Sunday',
                  sorting: 100,
                },
              ],
            },
          },
        },
      },
    });
  }
}

module.exports = RelationSource;
