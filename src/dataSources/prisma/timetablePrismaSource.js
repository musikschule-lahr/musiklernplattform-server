const PrismaSource = require('./PrismaSource');

class TimetableSource extends PrismaSource {
  async getTimetable(args) {
    const timetable = this.prisma.timetable.findOne(
      {
        where: args.where,
        include: {
          days: {
            include: {
              timeslots: {
                include: {
                  group: true,
                  user: true,
                },
                orderBy: { time: 'asc' },
              },
            },
          },
        },
      },
    );
    return timetable;
  }

  async getTimeslot(args) {
    const timeslot = this.prisma.timeslot.findOne(
      {
        where: args,
      },
    );
    return timeslot;
  }

  // Mutations
  async addTimeslotUser(args) {
    const timeslot = await this.prisma.timeslot.create({
      data: {
        day: { connect: args.where.day },
        user: { connect: args.user },
        time: args.where.time,
      },
      include: {
        user: true,
      },
    });
    return timeslot;
  }

  async addTimeslotGroup(args) {
    const timeslot = await this.prisma.timeslot.create({
      data: {
        day: { connect: args.where.day },
        group: { connect: args.group },
        time: args.where.time,
      },
      include: {
        group: true,
      },
    });
    return timeslot;
  }

  async updateTimeslotUser(args) {
    /*
        Muss leider so gehandhabt werden:
        https://github.com/prisma/prisma-client-js/issues/681
      */
    const timeslot = await this.getTimeslot(args.where);
    const data = { user: { connect: args.target } };
    if (timeslot.groupId != null) data.group = { disconnect: true };
    if (args.to) {
      data.time = args.to.time;
      data.day = { connect: args.to.day };
    }
    const timeslotUpdated = await this.updateTimeslot(
      { where: args.where, data },
    );
    return timeslotUpdated;
  }

  async updateTimeslotGroup(args) {
    const timeslot = await this.getTimeslot(args.where);
    const data = { group: { connect: args.target } };
    if (timeslot.studentId != null) data.user = { disconnect: true };
    if (args.to) {
      data.time = args.to.time;
      data.day = { connect: args.to.day };
    }
    const timeslotUpdated = await this.updateTimeslot(
      { where: args.where, data },
    );
    return timeslotUpdated;
  }

  async updateTimeslot(args) {
    const timeslot = await this.prisma.timeslot.update({
      ...args,
      include: {
        user: true,
        group: true,
      },
    });
    return timeslot;
  }

  async removeTimeslot(args) {
    const timeslot = await this.prisma.timeslot.delete({
      ...args,
    });
    return timeslot;
  }
}

module.exports = TimetableSource;
