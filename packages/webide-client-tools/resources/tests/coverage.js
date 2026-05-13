/* eslint-disable */
define(["https://unpkg.com/lodash@4.17.2/lodash.min.js"], function (_) {
  var mergeCoverageOccurrences = _.partialRight(
    _.mergeWith,
    function (objBVal, srcBVal) {
      // times entered
      if (_.isNumber(objBVal)) {
        return objBVal + srcBVal // aggregate
      } else {
        throw new Error("expecting number in coverage occurrences")
      }
    }
  )

  function mergeSingleFileCoverageInfo(obj, src) {
    _.mergeWith(obj.b, src.b, function (objBVal, srcBVal) {
      // branches arrs
      if (_.isArray(objBVal)) {
        return _.map(objBVal, function (objBranchesInt, key) {
          return objBranchesInt + srcBVal[key]
        })
      } else {
        throw new Error("expecting array")
      }
    })

    mergeCoverageOccurrences(obj.f, src.f)
    mergeCoverageOccurrences(obj.s, src.s)

    return obj
  }

  function mergeIstanbulCoverageData(obj, src) {
    _.assignWith(obj, src, function (objectValue, sourceValue) {
      // data only exists on source
      if (_.isUndefined(objectValue)) {
        return sourceValue
      } else if (_.isUndefined(sourceValue)) {
        // no new data from source
        return objectValue
      } else {
        // need to merge
        return mergeSingleFileCoverageInfo(objectValue, sourceValue)
      }
    })
  }

  return {
    mergeIstanbulCoverageData: mergeIstanbulCoverageData,
  }
})
