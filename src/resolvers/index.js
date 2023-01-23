const path = require("path");
const fsPromises = require("fs/promises");
const { readJsonFile, fileExists } = require("../utils/fileHandling");
const crypto = require("node:crypto");
const { graphql, GraphQLError } = require("graphql");
const { json } = require("express");

const itemDirectory = path.join(__dirname, "/src/data/projects");

exports.resolvers = {
  Query: {
    getItembyId: async (_, args) => {
      const itemId = args.itemId;

      const itemFilePath = path.join(itemDirectory, `${itemId}.json`);

      const itemExists = await fileExists(itemFilePath);

      if (!itemExists) return new GraphQLError("That project does not exist");

      const itemData = await fsPromises.readFile(itemFilePath, {
        encoding: "utf-8",
      });

      const data = JSON.parse(itemData);

      return data;
    },
  },
};
