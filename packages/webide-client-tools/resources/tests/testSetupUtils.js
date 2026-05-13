// Needs to run in browser, but the eslint config here is for node.js (ES6).
/* eslint-disable */
"use strict"

window.webappPath = function () {
  return "/base/node_modules/webide/src/main/webapp/"
}

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
window.merge_objects = function (obj1, obj2) {
  // not using lodash to avoid depending on it and including it in every karma.conf/HCP html runner
  var obj3 = {}
  for (var attrname in obj1) {
    obj3[attrname] = obj1[attrname]
  }
  for (var attrname in obj2) {
    obj3[attrname] = obj2[attrname]
  }
  return obj3
}
