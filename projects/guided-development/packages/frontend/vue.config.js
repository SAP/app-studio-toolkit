const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    runtimeCompiler: true,
    publicPath: "./",
    transpileDependencies: ["vuetify"],
    productionSourceMap: false,
    configureWebpack: (config) => {
      config.devtool = 'source-map'
  }
});
