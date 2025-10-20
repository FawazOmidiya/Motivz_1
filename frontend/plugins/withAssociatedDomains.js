const { withInfoPlist } = require("@expo/config-plugins");

const withAssociatedDomains = (config) => {
  return withInfoPlist(config, (config) => {
    if (!config.modResults.CFBundleAssociatedDomains) {
      config.modResults.CFBundleAssociatedDomains = [];
    }

    // Add your associated domain
    config.modResults.CFBundleAssociatedDomains.push(
      "applinks:fomidiya-frontend.expo.app"
    );

    return config;
  });
};

module.exports = withAssociatedDomains;
