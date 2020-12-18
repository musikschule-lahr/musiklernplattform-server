const PrismaSource = require('./PrismaSource');

class UserSource extends PrismaSource {
  async getAllUsers(args) {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async getUser(args) {
    const user = await this.prisma.user.findOne({
      where: args.where,
      include: {
        playedInstruments: true,
        teachedInstruments: true,
        relatedTo: {
          include: {
            user: true,
            relatedUser: true,
          },
        },
        relatedBy: {
          include: {
            user: true,
            relatedUser: true,
          },
        },
      },
    });
    return user;
  }

  async getSchoolByUserId(args) {
    const user = await this.prisma.user.findOne({
      where: args.where,
      include: {
        school: true,
      },
    });
    return user.school;
  }

  async getInstruments() {
    const instruments = await this.prisma.instrument.findMany({
    });
    return instruments;
  }

  async getInstrument(args) {
    const instrument = await this.prisma.instrument.findOne({
      where: args.where,
    });
    return instrument;
  }

  async userCanUseManagement(args) {
    const user = await this.prisma.user.findOne(args);
    const allowed = [1, 2, 3];
    return allowed.includes(user.id);
    /*
    const user = await this.prisma.user.findFirst({
      where: {
        ...args.where,
        relatedTo: {
          some: {
            userRole: 'Office',
          },
        },
      },
    });
    return user; */
  }

  async addUserByAdmin(args) {
    const user = await this.prisma.user.create({
      data: args,
    });
    return user;
  }

  async addRegisteredUser(args) {
    const { instruments, ...data } = args.data;
    const user = await this.prisma.user.create({
      data: {
        ...data,
        board: {
          create: {
            lanes: {
              create: [
                {
                  title: 'To Do',
                  sorting: 100,
                  laneType: 'ToDo',
                }, {
                  title: 'Erledigt',
                  sorting: 200,
                  laneType: 'Done',
                }, {
                  title: 'Meine Sammlung',
                  sorting: 300,
                  laneType: 'Other',
                },
              ],
            },
          },
        },
        playedInstruments: {
          connect: instruments,
        },
      },
      include: {
        playedInstruments: true,
        teachedInstruments: true,
        relatedTo: {
          include: {
            user: true,
            relatedUser: true,
          },
        },
        relatedBy: {
          include: {
            user: true,
            relatedUser: true,
          },
        },
      },
    });
    return user;
  }

  async updateRegisteredUser(args) {
    const { where, data } = args;
    const { instruments, ...remaining } = data;
    const user = await this.prisma.user.update({
      where,
      data: {
        ...remaining,
        playedInstruments: {
          set: instruments,
        },
      },
      include: {
        playedInstruments: true,
        teachedInstruments: true,
        relatedTo: {
          include: {
            user: true,
            relatedUser: true,
          },
        },
        relatedBy: {
          include: {
            user: true,
            relatedUser: true,
          },
        },
      },
    });
    return user;
  }
}

module.exports = UserSource;
