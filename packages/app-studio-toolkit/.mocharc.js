const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
module.exports = {
  spec: "./tests/**/*.spec.ts",
};
