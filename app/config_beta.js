const config = require("./config_common")();
module.exports = function() {
  config.productName = 'Buckets Beta'
  config.appId = "com.onepartrain.buckets.desktopbeta"
  config.dmg.icon = "build_beta/dmg.icns"
  config.directories = {
      buildResources: 'build_beta',
  }
  config.publish = [
    {
      provider: 'github',
      owner: 'buckets',
      repo: 'desktop-beta',
    }
  ]
  // console.log(config);
  return config
}
