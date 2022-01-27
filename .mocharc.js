const chai = require("chai");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
const chaiAsPromised = require("chai-as-promised");

chai.use(deepEqualInAnyOrder);
chai.use(chaiAsPromised);

module.exports = {
  require: ["source-map-support/register"],
};
