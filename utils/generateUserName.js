const {
  uniqueNamesGenerator,
  adjectives,
  colors,
  starWars,
  names,
} = require("unique-names-generator");

function generateUserName() {
  const randomName = uniqueNamesGenerator({
    dictionaries: [colors, names, starWars],
    separator: " ",
    style: "capital",
    length: 2,
  });

  return randomName;
}

module.exports = generateUserName;
