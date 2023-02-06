const path = require("path");
const fsPromises = require("fs/promises");
const {
  fileExists,
  getDataById,
  populateCartProducts,
  saveDataToFile,
} = require("../utils");
const { GraphQLError, graphql } = require("graphql");
const crypto = require("node:crypto");

const productDirectory = path.join(__dirname, "..", "data", "products");
const cartDirectory = path.join(__dirname, "..", "data", "cart");

exports.resolvers = {
  Query: {
    getProductById: async (_, args) => {
      const productId = args.productId;
      return await getDataById(productId, productDirectory);
    },

    getAllProducts: async (_, args) => {
      const products = await fsPromises.readdir(productDirectory);

      const promises = [];

      products.forEach((fileName) => {
        const filePath = path.join(productDirectory, fileName);
        promises.push(readJsonFile(filePath));
      });
      const productData = await Promise.all(promises);
      return productData;
    },

    getCartById: async (_, args) => {
      const cartId = args.cartId;

      const cart = await getDataById(cartId, cartDirectory);
      const populatedCart = await populateCartProducts(cart);

      return populatedCart;
    },
  },
  Mutation: {
    createCart: async (_, args) => {
      const newCart = {
        id: crypto.randomUUID(),
        totalPrice: 0,
        name: args.name || "BÄSTA KORGEN",
        products: [],
      };

      await saveDataToFile(newCart, cartDirectory);
      return newCart;
    },

    addProductToCart: async (_, args) => {
      const cartId = args.cartId;
      const productId = args.productId;

      const cart = await getDataById(cartId, cartDirectory);
      cart.products.push(productId);

      const populatedCart = await populateCartProducts(cart);

      await saveDataToFile(cart, cartDirectory, false);

      return populatedCart;
    },

    removeProductFromCart: async (_, args) => {
      const cartId = args.cartId;
      const productId = args.productId;

      const cart = await getDataById(cartId, cartDirectory);

      cart.products = cart.products.filter((id) => id !== productId);

      await saveDataToFile(cart, cartDirectory, false);

      const populatedCart = await populateCartProducts(cart);
      return populatedCart;
    },

    deleteCart: async (_, args) => {
      const cartId = args.cartId;

      const filePath = path.join(cartDirectory, `${cartId}.json`);

      const cartExists = await fileExists(filePath);
      if (!cartExists) return new GraphQLError("That Cart does not exist");

      await fsPromises.unlink(filePath);
      return {
        deletedId: cartId,
        success: false,
      };
    },
    deleteProduct: async (_, args) => {
      const productId = args.productId;

      const filePath = path.join(productDirectory, `${productId}.json`);

      const productExists = await fileExists(filePath);
      if (!productExists) return new GraphQLError("That Cart does not exist");

      await fsPromises.unlink(filePath);
      return {
        deletedId: productId,
        success: false,
      };
    },
  },
};
