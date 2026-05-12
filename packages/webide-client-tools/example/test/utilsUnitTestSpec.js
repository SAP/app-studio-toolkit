// using "webide-plugin-example" path registered in testSetup.js
define(["webide-plugin-example/service/helloUtils"], function (helloUtils) {
  describe("Unit test example", function () {
    it("Can invoke a method on a require.js module", function () {
      expect(helloUtils.addAngryMode("hello")).to.contain("!")
    })
  })
})
