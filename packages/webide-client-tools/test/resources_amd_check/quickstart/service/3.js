/* eslint-disable */

// this should be detected as a non amd resource.
jquery.sap.define("foo")

define(["./2"], function () {
  console.log("BAR")
})
