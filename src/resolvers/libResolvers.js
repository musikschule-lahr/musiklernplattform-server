const axios = require('axios');

const Base64 = {

  // private property
  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

  // public method for encoding
  encode(input) {
    let output = '';
    let chr1; let chr2; let chr3; let enc1; let enc2; let enc3; let
      enc4;
    let i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output = output
          + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2)
          + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
    }

    return output;
  },

  // public method for decoding
  decode(input) {
    let output = '';
    let chr1; let chr2; let
      chr3;
    let enc1; let enc2; let enc3; let
      enc4;
    let i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

    while (i < input.length) {
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output += String.fromCharCode(chr1);

      if (enc3 != 64) {
        output += String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output += String.fromCharCode(chr3);
      }
    }

    output = Base64._utf8_decode(output);

    return output;
  },

  // private method for UTF-8 encoding
  _utf8_encode(string) {
    string = string.replace(/\r\n/g, '\n');
    let utftext = '';

    for (let n = 0; n < string.length; n++) {
      const c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  },

  // private method for UTF-8 decoding
  _utf8_decode(utftext) {
    let string = '';
    let i = 0;
    let c = c1 = c2 = 0;

    while (i < utftext.length) {
      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if ((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }

    return string;
  },

};

const resolvers = {
  Query: {
    getComposer: async (obj, args, context, info) => {
      const composer = await context.dataSources.prisma.lib.getComposer(
        args,
      );
      return composer;
    },
    getComposers: async (obj, args, context, info) => {
      const composer = await context.dataSources.prisma.lib.getComposers();
      return composer;
    },
    getInterpreters: async (obj, args, context, info) => {
      const interpreter = await context.dataSources.prisma.lib.getInterpreters();
      return interpreter;
    },
    getLibElement: async (obj, args, context, info) => {
      const libElem = await context.dataSources.prisma.lib.getLibElement(
        args,
      );
      return libElem;
    },
    getLibElementFromPath: async (obj, args, context, info) => {
      const libElem = await context.dataSources.prisma.lib.getLibElementFromPath(
        args,
      );
      return libElem;
    },
    getCategory: async (obj, args, context, info) => {
      const category = await context.dataSources.prisma.lib.getCategory(
        args,
      );
      return category;
    },
    getCategories: async (obj, args, context, info) => {
      const categories = await context.dataSources.prisma.lib.getCategories(
      );
      return categories;
    },
    getEpochs: async (obj, args, context, info) => {
      const epochs = await context.dataSources.prisma.lib.getEpochs(
        args,
      );
      return epochs;
    },
    getInstrumentations: async (obj, args, context, info) => {
      const instrumentations = await context.dataSources.prisma.lib.getInstrumentations(
        args,
      );
      return instrumentations;
    },
    filterLibElements: async (obj, args, context, info) => {
      const libElem = await context.dataSources.prisma.search.filterLibElements(
        args,
      );
      return libElem;
    },
  },
  Mutation: {
    addComposer: async (obj, args, context, info) => {
      const composer = await context.dataSources.prisma.lib.addComposer(
        {
          ...args,
        },
      );
      return composer;
    },
    updateComposer: async (obj, args, context, info) => {
      const composer = await context.dataSources.prisma.lib.updateComposer(
        {
          ...args,
        },
      );
      return composer;
    },
    removeComposer: async (obj, args, context, info) => {
      const composer = await context.dataSources.prisma.lib.removeComposer(
        {
          ...args,
        },
      );
      return true;
    },
    addEpoch: async (obj, args, context, info) => {
      const epoch = await context.dataSources.prisma.lib.addEpoch(
        {
          ...args,
        },
      );
      return epoch;
    },
    updateEpoch: async (obj, args, context, info) => {
      const epoch = await context.dataSources.prisma.lib.updateEpoch(
        {
          ...args,
        },
      );
      return epoch;
    },
    removeEpoch: async (obj, args, context, info) => {
      const epoch = await context.dataSources.prisma.lib.removeEpoch(
        {
          ...args,
        },
      );
      return true;
    },
    addInstrumentation: async (obj, args, context, info) => {
      const element = await context.dataSources.prisma.lib.addInstrumentation(
        {
          ...args,
        },
      );
      return element;
    },
    updateInstrumentation: async (obj, args, context, info) => {
      const element = await context.dataSources.prisma.lib.updateInstrumentation(
        {
          ...args,
        },
      );
      return element;
    },
    removeInstrumentation: async (obj, args, context, info) => {
      const element = await context.dataSources.prisma.lib.removeInstrumentation(
        {
          ...args,
        },
      );
      return true;
    },
    addInterpreter: async (obj, args, context, info) => {
      const interpreter = await context.dataSources.prisma.lib.addInterpreter(
        {
          ...args,
        },
      );
      return interpreter;
    },
    updateInterpreter: async (obj, args, context, info) => {
      const interpreter = await context.dataSources.prisma.lib.updateInterpreter(
        {
          ...args,
        },
      );
      return interpreter;
    },
    removeInterpreter: async (obj, args, context, info) => {
      const interpreter = await context.dataSources.prisma.lib.removeInterpreter(
        {
          ...args,
        },
      );
      return true;
    },
    addLibElement: async (obj, args, context, info) => {
      const libElem = await context.dataSources.prisma.lib.addLibElement(
        {
          user: { keycloakUserId: context.kauth.accessToken.content.sub },
          ...args,
        },
      );
      return libElem;
    },
    updateLibElement: async (obj, args, context, info) => {
      const libElem = await context.dataSources.prisma.lib.updateLibElement(
        {
          ...args,
        },
      );
      return libElem;
    },
    addCategory: async (obj, args, context, info) => {
      const category = await context.dataSources.prisma.lib.addCategory(
        {
          ...args,
        },
      );
      return category;
    },
    updateCategory: async (obj, args, context, info) => {
      const category = await context.dataSources.prisma.lib.updateCategory(
        {
          ...args,
        },
      );
      return category;
    },
    removeCategory: async (obj, args, context, info) => {
      await context.dataSources.prisma.lib.removeCategory(
        {
          ...args,
        },
      );
      return true;
    },
    addInstrument: async (obj, args, context, info) => {
      const instrument = await context.dataSources.prisma.lib.addInstrument(
        {
          ...args,
        },
      );
      return instrument;
    },
    updateInstrument: async (obj, args, context, info) => {
      const instrument = await context.dataSources.prisma.lib.updateInstrument(
        {
          ...args,
        },
      );
      return instrument;
    },
    removeInstrument: async (obj, args, context, info) => {
      await context.dataSources.prisma.lib.removeInstrument(
        {
          ...args,
        },
      );
      return true;
    },
    addTrack: async (obj, args, context, info) => {
      const track = await context.dataSources.prisma.lib.addTrack(
        {
          ...args,
        },
      );
      return track;
    },
    updateTrack: async (obj, args, context, info) => {
      const track = await context.dataSources.prisma.lib.updateTrack(
        {
          ...args,
        },
      );
      return track;
    },
    removeTrack: async (obj, args, context, info) => {
      const track = await context.dataSources.prisma.lib.getTrack(args);
      if (track.filePath) {
        const fileName = track.filePath.replace('https://my-app.sq2.ovh/files/', '');
        return axios.post('https://my-app.sq2.ovh/delete', { value: fileName }, {
          headers: {
            Authorization: `Basic ${Base64.encode('my-mgmt:s1nus2o2o')}`,
          },
        })
          .then(async (res) => {
            if (res.status === 200) {
              await context.dataSources.prisma.lib.removeTrack(args);
              return true;
            }
            // throw new Error('Datei wurde nicht gelöscht');
          })
          .catch((err) => {
            console.log('err', err);
            throw new Error(err);
          });
      }
      await context.dataSources.prisma.lib.removeTrack(args);
      return true;
    },
    removeTrackFile: async (obj, args, context, info) => {
      const track = await context.dataSources.prisma.lib.getTrack(args);
      const fileName = track.filePath.replace('https://my-app.sq2.ovh/files/', '');
      return axios.post('https://my-app.sq2.ovh/delete', { value: fileName }, {
        headers: {
          Authorization: `Basic ${Base64.encode('my-mgmt:s1nus2o2o')}`,
        },
      })
        .then(async (res) => {
          if (res.status === 200) {
            const edited = await context.dataSources.prisma.lib.updateTrack({
              where: args.where,
              data: { filePath: null },
            });
            return edited;
          }
          // throw new Error('Datei wurde nicht gelöscht');
        })
        .catch((err) => {
          console.log('err', err);
          throw new Error(err);
        });
    },
    removeCoverFile: async (obj, args, context, info) => {
      const libElement = await context.dataSources.prisma.lib.getLibElement(args);
      const { coverImagePath } = libElement.metaData;
      const fileName = coverImagePath.replace('https://my-app.sq2.ovh/files/', '');

      return axios.post('https://my-app.sq2.ovh/delete', { value: fileName }, {
        headers: {
          Authorization: `Basic ${Base64.encode('my-mgmt:s1nus2o2o')}`,
        },
      })
        .then(async (res) => {
          if (res.status === 200) {
            return true;
          }
          // throw new Error('Datei wurde nicht gelöscht');
        })
        .catch((err) => {
          console.log('err', err);
          throw new Error(err);
        });
    },
  },
  Category: {
    idCategory: (parent) => parent.id,
    parent: (parent) => parent.parentCategory,
    children: (parent) => parent.childCategories,
  },
  Composer:
    {
      idComposer(parent, args, context, info) {
        return parent.id;
      },
    },
  Epoch:
    {
      idEpoch(parent, args, context, info) {
        return parent.id;
      },
    },
  LibElement:
    {
      idLibElement(parent, args, context, info) {
        return parent.id;
      },
    },
  Interpreter:
    {
      idInterpreter(parent, args, context, info) {
        return parent.id;
      },
    },
  MetaData:
    {
      idMetaData(parent, args, context, info) {
        return parent.id;
      },
    },
  Track:
    {
      idTrack(parent, args, context, info) {
        return parent.id;
      },
    },
  Instrumentation: {
    idInstrumentation(parent, args, context, info) {
      return parent.id;
    },
  },

};

module.exports = resolvers;
