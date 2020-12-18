const PrismaSource = require('./PrismaSource');

class GroupSource extends PrismaSource {
  async getGroup(args) {
    const group = await this.prisma.group.findOne({
      where: { id: args.where.id },
      include: {
        board: true,
        relations: {
          include: {
            relatedUser: true,
          },
        },
      },
    });
    return group;
  }

  async getGroupsOfOwner(args) {
    const groups = await this.prisma.group.findMany({
      where: { owner: args.where },
      include: {
        board: true,
        relations: {
          include: {
            relatedUser: true,
          },
        },
      },
    });
    return groups;
  }

  async getGroupsOfUser(args) {
    const user = await this.prisma.userRelated.findMany({
      where: {
        AND: {
          relatedUser: args.where,
          NOT: [{ group: null }],
        },
      },
      include: {
        group: {
          include: {
            owner: true,
          },
        },
      },
    });
    const groups = [];
    user.forEach((e) => {
      groups.push(e.group);
    });
    return groups;
  }

  async addGroup(args) {
    const group = await this.prisma.group.create({
      data: {
        name: args.name,
        owner: {
          connect: {
            id: args.user,
          },
        },
        board: {
          create: {
            lanes: {
              create: [
                {
                  title: 'ToDo',
                  sorting: 100,
                  laneType: 'ToDo',
                }, /* {
                  title: 'Erledigt',
                  sorting: 200,
                  laneType: 'Other',
                }, */
              ],
            },
          },
        },
      },
    });

    return group;
  }

  async removeGroup(args) {
    const board = await this.prisma.group.findOne({
      where: args.where,
      include: {
        board: {
          include: {
            lanes: true,
          },
        },
        relations: true,
        owner: true,
      },
    });
    if (board.relations) {
      // TODO: Prüfen ob hierdurch Timeslots gelöscht werden
      await Promise.all(board.relations.map(async (relation) => {
        const count = await this.prisma.userRelated.count({
          where: {
            OR: [
              {
                userId: board.owner.id,
                relatedUserId: relation.relatedUserId,
              },
              {
                userId: relation.relatedUserId,
                relatedUserId: board.owner.id,
              },
            ],

          },
        });
        if (count < 2) {
          await this.prisma.timeslot.deleteMany({
            where: {
              studentId: relation.relatedUserId,
              day: {
                timetable: {
                  user: {
                    id: board.owner.id,
                  },
                },
              },
            },
          });
        }
        await this.prisma.userRelated.delete({
          where: { id: relation.id },
        });
      }));
    }

    if (board.board) {
      await Promise.all((board.board.lanes.map(async (lane) => {
        await this.prisma.lane.delete({
          where: { id: lane.id },
        });
      })));
      await this.prisma.board.delete({
        where: { id: board.board.id },
      });
    }

    await this.prisma.group.delete({
      where: args.where,
    });

    return args.where.id;
  }

  async updateGroupUsers(user, args) {
    const data = {
      user: {
        connect: { id: user.id },
      },
      group: {
        connect: args.where,
      },
      userRole: 'Teacher',
      relatedUserRole: 'Student',
    };

    if (args.addusers && !args.time) {
      await args.addusers.forEach(async (element) => {
        data.relatedUser = { connect: { id: element.id } };
        await this.prisma.userRelated.create({ data });
      });
    } else if (args.addusers && args.time) {
      await args.addusers.forEach(async (element) => {
        await this.prisma.userRelated.updateMany(
          {
            where: {
              userId: user.id,
              relatedUserId: element.id,
              groupId: args.where.id,
            },
            data: {
              confirmedAt: args.time,
            },
          },
        );
      });
    }

    if (args.removeusers) {
      await args.removeusers.forEach(async (element) => {
        const relatedUser = await this.prisma.userRelated.findFirst({
          where: {
            relatedUserId: element.id,
            userId: data.user.connect.id,
            groupId: data.group.connect.id,
          },
        });
        await this.prisma.userRelated.delete({
          where: {
            id: relatedUser.id,
          },

        });
      });
    }

    return null;
  }

  async addGroupMatrixRoom(args) {
    await this.prisma.group.update({
      where: { id: args.group },
      data: {
        matrixRoomId: args.room,
      },
    });

    return true;
  }
}

module.exports = GroupSource;
