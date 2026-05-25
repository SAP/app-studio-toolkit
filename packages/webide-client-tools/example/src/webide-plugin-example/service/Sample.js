/**
 * A service implementation sample for displaying a greeting notification and counting the number of alerts displayed.
 *
 * The service provides a public API which is defined in its interface (in this example, Sample.json file)
 * and can be used by other plugins.
 *
 * Every method call on a service is asynchronous and returns a Q-promise.
 * If not done explicitly by the method, the return value is automatically wrapped with a promise object.
 *
 * Other services (which are required by this service plugin, as defined in the plugin.json file) can be accessed
 * using 'this.context.service' property.
 *
 * A service can fire events that are defined in its interface. These events can be handled by any other service.
 *
 * A service can also handle events from any other service (including its own).
 * The events subscription along with the handler methods must be defined in the plugin.json file.
 *
 */
define(["./helloUtils"], function (utils) {
  return {
    _iNotificationCount: null,

    modifyMe: "sample",

    init: function () {
      this._iNotificationCount = 0
    },

    sayHello: function (sName) {
      var that = this
      this._iNotificationCount++
      var sMessage = this.context.i18n.getText("i18n", "sample_helloMessage", [
        sName,
      ])

      var angryMessage = utils.addAngryMode(sMessage)
      // Display greeting notification and fire event
      return this.context.service.usernotification
        .info(angryMessage)
        .then(function () {
          return that.context.event.fireNotificationDisplayed({
            notificationCount: that.getNotificationCount(),
          })
        })
    },

    getNotificationCount: function () {
      return this._iNotificationCount
    },

    onAfterNotificationDisplayed: function (oEvent) {
      var iCount = oEvent.params.notificationCount
      // Display log message to the SAP Web IDE console (accessed via 'View->Console' menu)
      // Log messages don't need to be translatable
      this.context.service.log
        .info(
          "Sample",
          "Number of Hello notifications shown so far: " + iCount,
          ["user"]
        )
        .done()
    },

    modifyVar: function (sName) {
      this.setModifyMe(sName)
      return this.modifyMe
    },

    setModifyMe: function (sName) {
      this.modifyMe = sName + "ModifiedSample"
    },
  }
})
