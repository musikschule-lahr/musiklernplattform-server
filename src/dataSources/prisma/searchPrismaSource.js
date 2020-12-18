const { sort, map } = require('ramda');
const PrismaSource = require('./PrismaSource');

class SearchSource extends PrismaSource {
  // Queries

  // TODO: Nested Queries gehen nicht: https://github.com/prisma/prisma-client-js/issues/249
  // Aktuell haben wir nur wenige Daten in DB und keine Pagination benötigt
  // -> daher resultset sortiert
  // Muss angepasst werden!!!
  async filterLibElements(args) {
    const {
      title, comment, composer, instruments, epochs, difficulty, playerType, interpreter,
    } = args.filter;
    const filter = { AND: [{ metaData: { AND: [{ OR: [] }] } }] };

    if ((title || '').length > 0) {
      filter.AND[0].metaData.AND[0].OR.push({ title: { contains: title } });
    }
    if ((comment || '').length > 0) {
      filter.AND[0].metaData.AND[0].OR.push({ comment: { contains: comment } });
    }
    if (interpreter) {
      if (interpreter.name) {
        filter.AND[0].metaData.AND[0].OR.push({
          interpreter: { name: { contains: interpreter.name } },
        });
      }
    }
    if (composer) {
      if (composer.firstname) {
        filter.AND[0].metaData.AND[0].OR.push({
          composer: { firstname: { contains: composer.firstname } },
        });
      }
      if (composer.lastname) {
        filter.AND[0].metaData.AND[0].OR.push({
          composer: { lastname: { contains: composer.lastname } },
        });
      }
    }
    if (instruments) {
      instruments.forEach((instrument) => {
        filter.AND.push({ instruments: { some: instrument } });
      });
    }
    if ((playerType || '').length > 0) {
      filter.AND.push({ playerType });
    }
    if (epochs) {
      //  epochs.forEach((epoch) => {
      filter.AND[0].metaData.AND.push({ epoch: { OR: epochs } });
    //  });
    }
    if (difficulty) {
      filter.AND[0].metaData.AND.push({
        //    metaData: {
        NOT:
            [{
              difficultyMin: {
                gt: difficulty.min,
              },
            },
            {
              difficultyMax: {
                lt: difficulty.max,
              },
            }],

        //   },
      });
    }

    // remove if no OR filter:
    if (filter.AND[0].metaData.AND[0].OR.length < 1)filter.AND[0].metaData.AND.splice(0, 1);
    // const flatinstruments = instruments.map((i) => (i.id));
    const elements = await this.prisma.libElement.findMany({
      where: filter,
      include: {
        author: true,
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
      },
    });
    let sortedElements = [...elements];
    if (args.sorting) {
      const sortFunc = (direction) => (
        (a, b) => {
          if (typeof a.whichValue === 'string') {
            return ((direction === 'DESC') ? -1 * a.whichValue.localeCompare(b.whichValue)
              : a.whichValue.localeCompare(b.whichValue));
          }
          return ((direction === 'DESC') ? b.whichValue - a.whichValue : a.whichValue - b.whichValue);
        });
      const sortFuncWithValue = sortFunc(args.sorting.direction);
      let filtered = [];
      switch (args.sorting.which) {
        case 'TITLE': {
          filtered = map((element) => (
            { ...element, whichValue: element.metaData.title }),
          elements);
          break;
        }
        case 'COMPOSER': {
          filtered = map((element) => (
            {
              ...element,
              whichValue: `${
                element.metaData.composer.firstname.replace(/[^\w]/gi, '')}${
                element.metaData.composer.lastname.replace(/[^\w]/gi, '')}`,
            }),
          elements);
          break;
        }
        case 'COMPOSER_FIRSTNAME': {
          filtered = map((element) => (
            {
              ...element,
              whichValue: `${
                element.metaData.composer.firstname.replace(/[^\w]/gi, '')}`,
            }),
          elements);
          break;
        }
        case 'COMPOSER_LASTNAME': {
          filtered = map((element) => (
            {
              ...element,
              whichValue: `${
                element.metaData.composer.lastname.replace(/[^\w]/gi, '')}`,
            }),
          elements);
          break;
        }
        case 'INTERPRETER': {
          filtered = map((element) => (
            {
              ...element,
              whichValue: `${
                element.metaData.interpreter.name.replace(/[^\w]/gi, '')}`,
            }),
          elements);
          break;
        }
        case 'DIFFICULTYLOWER': {
          filtered = map((element) => (
            { ...element, whichValue: element.metaData.difficultyMin }),
          elements);
          break;
        }
        case 'DIFFICULTYHIGHER': {
          filtered = map((element) => (
            { ...element, whichValue: element.metaData.difficultyMax }),
          elements);
          break;
        }
        default: {
          return sortedElements;
        }
      }
      sortedElements = sort(sortFuncWithValue, filtered);
    }
    return sortedElements;
  }
}

module.exports = SearchSource;
