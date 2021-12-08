const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

module.exports = {
  require: ["source-map-support/register"],
};
