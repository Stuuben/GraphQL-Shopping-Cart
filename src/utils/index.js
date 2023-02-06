const fsPromises = require("fs/promises");
const path = require("path");
const crypto = require("node:crypto");
const { GraphQLError } = require("graphql");

const productDirectory = path.join(__dirname, "..", "data", "products");

async function fileExists(filePath) {
  return !!(await fsPromises.stat(filePath).catch((e) => false));
}

async function readJsonFile(filePath) {
  return JSON.parse(await fsPromises.readFile(filePath, { encoding: "utf-8" }));
}

async function getDataById(id, directory) {
  const filePath = path.join(directory, `${id}.json`);

  const fileExist = await fileExists(filePath);
  if (!fileExist) throw new GraphQLError(`File does not exists: ${filePath}`);

  const fileData = await fsPromises.readFile(filePath, { encoding: "utf-8" });
  const data = JSON.parse(fileData);
  return data;
}

async function saveDataToFile(data, directory, checkForExisting = true) {
  let filePath = path.join(directory, `${data.id}.json`);

  if (checkForExisting) {
    let idExists = true;
    while (idExists) {
      const exist = await fileExists(filePath);
      if (exist) {
        data.id = crypto.randomUUID();
        filePath = path.join(directory, `${data.id}.json`);
      }
      idExists = exist;
    }
  }

  console.log("Saving", filePath, data.products.length);
  await fsPromises.writeFile(filePath, JSON.stringify(data));
}

async function populateCart(cart) {
  const populatedCart = { ...cart };

  const promises = [];
  populatedCart.products.forEach((productId) => {
    const productDataPromise = getDataById(productId, productDirectory);
    promises.push(productDataPromise);
  });
  populatedCart.products = await Promise.all(promises);

  let totalPrice = 0;

  for (product of populatedCart.products) {
    totalPrice += product.price ?? 0;
  }

  populatedCart.totalPrice = totalPrice;

  return populatedCart;
}

module.exports = {
  fileExists,
  readJsonFile,
  getDataById,
  saveDataToFile,
  populateCartProducts: populateCart,
};
