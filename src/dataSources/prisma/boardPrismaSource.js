const PrismaSource = require('./PrismaSource');

class BoardSource extends PrismaSource {
  async getCardSorting(args, cardIdToExclude = 0) {
    const cardsInLane = await this.prisma.cardLane.count({
      where: {
        lane: args.to.lane,
      },
    });

    // Negative Werte verbieten
    let desiredPosition = Math.max(args.to.sorting, 0);
    // maximalWert = cardsInLane => ansonsten skip Wert zu hoch
    desiredPosition = Math.min(desiredPosition, cardsInLane);
    let needsResorting = false;

    // Vorgänger & Nachfolger finden
    const cardLanes = await this.prisma.cardLane.findMany({
      where: {
        lane: args.to.lane,
        cardId: {
          not: cardIdToExclude,
        },
      },
      orderBy: {
        sorting: 'asc',
      },
      skip: Math.max(desiredPosition - 1, 0),
      take: (desiredPosition > 0 ? 2 : 1),
    });

    // Sortierung von Vorgänger & Nachfolger suchen
    let lower = 0;
    let upper = 100;

    // hat Vorgänger UND Nachfolger => in Mitte einfügen
    if (cardLanes[1]) {
      lower = cardLanes[0].sorting;
      upper = cardLanes[1].sorting;
    // hat Vorgänger ODER Nachfolger
    } else if (cardLanes[0]) {
      // hat Nachfolger => an Anfang einfügen
      if (desiredPosition === 0) {
        upper = cardLanes[0].sorting;
      // hat Vorgänger => ans Ende einfügen
      } else {
        lower = cardLanes[0].sorting + 100;
        upper = lower;
      }
    // Spalte leer => an Pos 100 einfügen
    } else {
      lower = 100;
    }

    const distance = upper - lower;
    let calculatedSorting = upper;

    if (distance > 0) {
      if (distance > 10) {
        calculatedSorting = Math.ceil(lower + distance / 2);
      } else {
        calculatedSorting = lower + 1;

        needsResorting = true;
      }
    }

    return { calculatedSorting, needsResorting };
  }

  async resortLane(lane) {
    const laneId = parseInt(lane.id, 10);
    await this.prisma.executeRaw`CALL resortLane(${laneId})`;
  }

  async getUserBoard(args, filterOther) {
    const boards = await this.prisma.board.findOne({
      where: args.where,
      include: {
        lanes: true,
      },
    });
    if (filterOther) boards.lanes = boards.lanes.filter((lane) => lane.laneType !== 'Other');
    return boards;
  }

  async getBoardLanes(args) {
    const lanes = await this.prisma.lane.findMany({
      where: {
        board: args.where,
      },
    });
    return lanes;
  }

  async getBoardUser(args) {
    const board = await this.prisma.board.findOne({
      where: args.where,
      include: {
        user: true,
      },
    });
    return board.user;
  }

  async getBoardFromLane(args) {
    const lane = await this.prisma.lane.findOne({
      where: args.where,
      include: {
        board: true,
      },
    });
    return lane.board;
  }

  async getUserCards(args) {
    const cards = await this.prisma.card.findMany({
      where: {
        cardLanes: {
          every: {
            lane: {
              board: {
                userId: args.where.id,
              },
            },
          },
        },
      },
      include: {
        creator: true,
      },
    });
    return cards;
  }

  async getUserCreatedCards(args) {
    const cards = await this.prisma.card.findMany({
      where: {
        creator: args.where,
      },
    });
    return cards;
  }

  async getUserUpdatedCards(args) {
    const cards = await this.prisma.card.findMany({
      where: {
        lastEditor: args.where,
      },
    });
    return cards;
  }

  async getLaneCards(args) {
    const cardLanes = await this.prisma.cardLane.findMany({
      where: {
        lane: args.where,
      },
      orderBy: {
        sorting: 'asc',
      },
      include: {
        card: {
          include: {
            creator: true,
            libElements: {
              include: {
                metaData: {
                  include: { composer: true, interpreter: true },
                },
              },
            },
          },
        },
      },
    });
    const cards = cardLanes.map((cardLane) => cardLane.card);

    return cards;
  }

  async getGroupBoard(args) {
    const group = await this.prisma.group.findOne({
      where: { id: args.where.id },
      include: {
        board: {
          include: {
            lanes:
            {
              include: {
                cardLanes: {
                  include: {
                    card: {
                      include: {
                        creator: true,
                        libElements: {
                          include: {
                            metaData: {
                              include: { composer: true, interpreter: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    return group.board;
  }

  async addCard(args) {
    const { libElement, ...argsData } = args.data;
    const data = {
      ...argsData,
      creator: {
        connect: args.addedBy,
      },
    };
    if (libElement) {
      data.libElements = { connect: [libElement] };
    }
    return this.prisma.card.create({
      data,
      include: {
        creator: true,
        libElements: {
          include: {
            metaData: {
              include: { composer: true, interpreter: true },
            },
          },
        },
      },
    });
  }

  async addCardToCardLane(card, lane, sortingResult) {
    const cardLane = await this.prisma.cardLane.create({
      data: {
        sorting: sortingResult.calculatedSorting,
        card: {
          connect: { id: card.id },
        },
        lane: {
          connect: lane,
        },
      },
      include: {
        lane: {
          include: {
            board: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    if (sortingResult.needsResorting) {
      await this.resortLane(lane);
    }
    return cardLane;
  }

  // Mutations
  async addUserCard(args) {
    const card = await this.addCard(args);
    const sortingResult = await this.getCardSorting(args, card.id);
    const cardLane = await this.addCardToCardLane(card, args.to.lane, sortingResult);
    return { card, cardLane };
  }

  async addGroupCard(args) {
    const card = await this.addCard(args);
    const sortingResult = await this.getCardSorting(args, card.id);
    // Hinzufügen zum Gruppenboard:
    await this.addCardToCardLane(card, args.to.lane, sortingResult);
    // Hinzufügen zu Userboards:
    const lanes = await this.prisma.lane.findMany({
      where: {
        board: {
          user: {
            relatedTo: {
              some: {
                group: {
                  id: args.group.id,
                },
                NOT: { confirmedAt: null },
              },
            },
          },
        },
        laneType: {
          equals: 'ToDo',
        },
      },
      include: {
        board: {
          include: {
            user: true,
          },
        },
      },
    });
    // größtmöglicher wert der DB, wir neu gesorted
    await Promise.all(lanes.map(async (lane) => {
      await this.addCardToCardLane(card,
        { id: lane.id },
        { calculatedSorting: 2147483647, needsResorting: true });
    }));
    return { card, lanes };
  }

  async moveCard(args) {
    const sortingResult = await this.getCardSorting(args, args.where.card.id);
    const cardLane = await this.prisma.cardLane.update({
      where: {
        cardId_laneId: {
          cardId: args.where.card.id,
          laneId: args.where.lane.id,
        },
      },
      data: {
        lane: {
          connect: args.to.lane,
        },
        sorting: sortingResult.calculatedSorting,
      },
      include: {
        card: {
          include: {
            creator: true,
            libElements: {
              include: {
                metaData: {
                  include: { composer: true, interpreter: true },
                },
              },
            },
          },
        },
      },
    });

    if (sortingResult.needsResorting) {
      await this.resortLane(args.to.lane.id);
    }

    return cardLane.card;
  }

  async updateCardContent(args) {
    const card = await this.prisma.card.update({
      where: args.where,
      data: {
        ...args.data,
        updatedAt: new Date(),
        lastEditor: {
          connect: args.updatedBy,
        },
      },
      include: {
        creator: true,
        libElements: {
          include: {
            metaData: {
              include: { composer: true, interpreter: true },
            },
          },
        },
      },
    });

    const lanes = await this.prisma.cardLane.findMany({
      where: { card: args.where },
      include: {
        lane: {
          include: {
            board: {
              include: {
                user: true,
              },
            },
          },
        },

      },
    });
    return { lanes, card };
  }

  async removeCard(args) {
    /* Aktuell noch Bug in Prisma, nur optionale Relations lassen sich über CASCADE DELETE löschen
     * Bei den n:m Tabellen ohne eigenes Indexfeld sind die Felder als compound key aber required.
     * Sollte in einer der nächsten prisma Versionen behoben sein.
     * vgl. https://github.com/prisma/prisma/issues/2057
     * https://github.com/prisma/prisma/issues/2810
     * Daher werden aktuell über deleteMany alle Relations vor dem eigentlichen delete gelöscht.
     */

    const lanes = await this.prisma.cardLane.findMany({
      where: { cardId: args.where.id },
      include: {
        lane: {
          include: {
            board: {
              include: {
                user: true,
              },
            },
          },

        },
      },
    });
    await this.prisma.cardLane.deleteMany({
      where: { cardId: args.where.id },
    });
    const card = await this.prisma.card.delete({
      where: args.where,
    });
    return { card, lanes };
  }
}

module.exports = BoardSource;
