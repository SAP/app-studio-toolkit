"use strict"

const _ = require("lodash")
const pathUtils = require("path")
const fs = require("fs-extra")

let linefeed = "\n"
/* istanbul ignore next - difficult to test without aggregating coverage results of both *nix/windows builds */
if (process.platform === "win32") {
  linefeed = "\r\n"
}

const utils = {
  linefeed,
  normalizelf: (inputString) => inputString.replace(/\r\n|\n/g, utils.linefeed),
  /**
   * Replace back slashes (Windows-based file path format) with forward slashes (*nix-based file path format) so that
   * libraries that rely on forward slashes will receive the proper input
   * @param unformattedPath
   * @returns {*}
   */
  backslashesToSlashes(unformattedPath) {
    if (_.isUndefined(unformattedPath)) {
      return unformattedPath
    }
    return unformattedPath.replace(/\\/g, "/")
  },

  /**
   * Sorts array by item's length property
   * Side effect free.
   *
   * @param {Array} arr
   * @returns {Array}
   */
  sortByLength(arr) {
    const clonedArr = _.clone(arr)
    clonedArr.sort((a, b) => b.length - a.length)
    return clonedArr
  },

  /**
   * Sorts array by item.<prop> length property
   * Side effect free.
   *
   * @param {Array} arr
   * @param {string} prop
   *
   * @returns {Array}
   */
  sortByPropLength(arr, prop) {
    const clonedArr = _.clone(arr)
    clonedArr.sort((a, b) => b[prop].length - a[prop].length)
    return clonedArr
  },

  splitPathAndFile(fullPath) {
    const match = /(.+?)\/([^/]+)$/.exec(fullPath)
    const path = match[1]
    const file = match[2]

    return { path, file }
  },

  readJsonSync(path) {
    const normalizedPath = utils.backslashesToSlashes(path)
    const resolvedPath = pathUtils.resolve(normalizedPath)
    const file = fs.readFileSync(resolvedPath, "utf8")
    return JSON.parse(file)
  },
}

module.exports = utils
