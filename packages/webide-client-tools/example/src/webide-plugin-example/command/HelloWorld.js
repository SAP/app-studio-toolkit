/**
 * A command sample for calling the 'sample' service.
 *
 * The command is added to the menu bar at 'Tools->Sample->Hello World' as defined in the plugin.json file.
 */
define({
  execute: function () {
    return this.context.service.sample.sayHello("World")
  },
})
