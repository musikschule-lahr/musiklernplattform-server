const { sort, map } = require('ramda');
const PrismaSource = require('./PrismaSource');

class LibSource extends PrismaSource {
  // Queries
  async getComposer(args) {
    const element = await this.prisma.composer.findOne({
      where: args.where,
    });
    return element;
  }

  async getComposers(args) {
    const element = await this.prisma.composer.findMany({
      orderBy: [{ firstname: 'asc' },
        { lastname: 'asc' }]
      ,
    });
    return element;
  }

  async getLibElement(args) {
    const element = await this.prisma.libElement.findOne({
      where: args.where,
      include: {
        metaData: {
          include: {
            composer: true,
            interpreter: true,
            epoch: true,
            instrumentation: true,
          },
        },
        author: true,
        instruments: true,
        categories: true,
        tracks: {
          orderBy: {
            sorting: 'asc',
          },
        },
      },
    });
    return element;
  }

  async getLibElementFromPath(args) {
    const element = await this.prisma.libElement.findOne({
      where: {
        playerPath: args.where.pathId,
      },
      include: {
        metaData: {
          include: {
            composer: true,
            interpreter: true,
            epoch: true,
            instrumentation: true,
          },
        },
        author: true,
        instruments: true,
        categories: true,
        tracks: {
          orderBy: {
            sorting: 'asc',
          },
        },
      },
    });
    return element;
  }

  async getTrack(args) {
    return this.prisma.track.findOne({
      where: args.where,
    });
  }

  async getCategory(args) {
    const element = await this.prisma.category.findOne({
      where: args.where,
      include: {
        childCategories: true,
        parentCategory: true,
      },
    });
    return element;
  }

  async getCategories(args) {
    const elements = await this.prisma.category.findMany({
      include: {
        childCategories: true,
        parentCategory: true,
      },
    });
    return elements;
  }

  async getEpochs(args) {
    const epochs = await this.prisma.epoch.findMany({
    });
    return epochs;
  }

  async getInstrumentations(args) {
    const instrumentations = await this.prisma.instrumentation.findMany({
    });
    return instrumentations;
  }

  async getInterpreters(args) {
    const interpreters = await this.prisma.interpreter.findMany({
    });
    return interpreters;
  }

  // Mutations
  async addComposer(args) {
    const element = await this.prisma.composer.create({
      data: args.data,
    });
    return element;
  }

  async updateComposer(args) {
    const element = await this.prisma.composer.update({
      where: args.where,
      data: args.data,
    });
    return element;
  }

  async removeComposer(args) {
    await this.prisma.composer.delete({
      where: args.where,
    });
  }

  async addTrack(args) {
    const { libElement, data } = args;
    const element = await this.prisma.track.create({
      data: {
        libElement: {
          connect: libElement,
        },
        ...data,
      },
    });
    return element;
  }

  async updateTrack(args) {
    const element = await this.prisma.track.update({
      where: args.where,
      data: args.data,
    });
    return element;
  }

  async removeTrack(args) {
    await this.prisma.track.delete({
      where: args.where,
    });
  }

  async addEpoch(args) {
    const element = await this.prisma.epoch.create({
      data: args.data,
    });
    return element;
  }

  async updateEpoch(args) {
    const element = await this.prisma.epoch.update({
      where: args.where,
      data: args.data,
    });
    return element;
  }

  async removeEpoch(args) {
    await this.prisma.epoch.delete({
      where: args.where,
    });
  }

  async addInstrumentation(args) {
    const element = await this.prisma.instrumentation.create({
      data: args.data,
    });
    return element;
  }

  async updateInstrumentation(args) {
    const element = await this.prisma.instrumentation.update({
      where: args.where,
      data: args.data,
    });
    return element;
  }

  async removeInstrumentation(args) {
    await this.prisma.instrumentation.delete({
      where: args.where,
    });
  }

  async addInterpreter(args) {
    const element = await this.prisma.interpreter.create({
      data: args.data,
    });
    return element;
  }

  async updateInterpreter(args) {
    const element = await this.prisma.interpreter.update({
      where: args.where,
      data: args.data,
    });
    return element;
  }

  async removeInterpreter(args) {
    await this.prisma.interpreter.delete({
      where: args.where,
    });
  }

  async addInstrument(args) {
    const element = await this.prisma.instrument.create({
      data: args.data,
    });
    return element;
  }

  async updateInstrument(args) {
    const element = await this.prisma.instrument.update({
      where: args.where,
      data: args.data,
    });
    return element;
  }

  async removeInstrument(args) {
    await this.prisma.instrument.delete({
      where: args.where,
    });
  }

  async addLibElement(args) {
    const {
      composer, interpreter, epoch, instrumentation, ...rest
    } = args.data.metadata;
    const create = {
      author: { connect: args.user },
      createdAt: new Date(),
      updatedAt: new Date(),
      playerType: args.data.playerType,
      productionNo: args.data.productionNo,
      metaData: {
        create: {
          ...rest,
          composer: {
            connect: composer,
          },
          interpreter: {
            connect: interpreter,
          },
          epoch: {
            connect: epoch,
          },
          instrumentation: {
            connect: instrumentation,
          },
        },

      },
    };

    if (args.data.instruments) {
      create.instruments = {
        connect: args.data.instruments,
      };
    }
    if (args.data.categories) {
      create.categories = {
        connect: args.data.categories,
      };
    }
    const element = await this.prisma.libElement.create({
      data: create,
      include: {
        metaData: {
          include: {
            composer: true,
            interpreter: true,
            epoch: true,
            instrumentation: true,
          },
        },
        instruments: true,
        categories: true,
        tracks: true,
        author: true,
      },
    });
    return element;
  }

  async updateLibElement(args) {
    const update = {
      updatedAt: new Date(),
      productionNo: args.data.productionNo,
    };
    if (args.data.playerType)update.playerType = args.data.playerType;
    if (args.data.metadata) {
      const {
        composer, interpreter, epoch, instrumentation, ...rest
      } = args.data.metadata;
      update.metaData = {
        update: {
          ...rest,
        },
      };
      if (composer) {
        update.metaData.update.composer = { connect: composer };
      }
      if (interpreter) {
        update.metaData.update.interpreter = { connect: interpreter };
      }
      if (epoch) {
        update.metaData.update.epoch = { connect: epoch };
      }
      if (instrumentation) {
        update.metaData.update.instrumentation = { connect: instrumentation };
      }
    }

    if (args.data.categories) {
      update.categories = {
        set: args.data.categories,
      };
    }
    if (args.data.instruments) {
      update.instruments = {
        set: args.data.instruments,
      };
    }

    const element = await this.prisma.libElement.update({
      where: args.where,
      data: update,
      include: {
        metaData: {
          include: {
            composer: true,
            interpreter: true,
            epoch: true,
            instrumentation: true,
          },
        },
        instruments: true,
        categories: true,
        tracks: true,
        author: true,
      },
    });
    return element;
  }

  async addCategory(args) {
    const create = {
      name: args.data.name,
    };
    if (args.data.parent) {
      create.parentCategory = {
        connect: args.data.parent,
      };
    }
    if (args.data.children) {
      create.childCategories = {
        connect: args.data.children,
      };
    }
    const element = await this.prisma.category.create({
      data: create,
      include: {
        childCategories: true,
        parentCategory: true,
      },
    });
    return element;
  }

  async updateCategory(args) {
    const update = {

    };
    if (args.data.name) {
      update.name = args.data.name;
    }
    if (args.data.parent) {
      update.parentCategory = {
        connect: args.data.parent,
      };
    }
    if (args.data.children) {
      update.childCategories = {
        connect: args.data.children,
      };
    }
    const element = await this.prisma.category.update({
      where: args.where,
      data: update,
      include: {
        childCategories: true,
        parentCategory: true,
      },
    });
    return element;
  }

  async removeCategory(args) {
    await this.prisma.category.delete({
      where: args.where,
    });
    return true;
  }
}

module.exports = LibSource;
