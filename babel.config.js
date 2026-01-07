module.exports = function (api) {
  api.cache(true);
  const nativeWindPlugin = require("nativewind/babel");
  return {
    presets: ["babel-preset-expo"],
    plugins: [...nativeWindPlugin().plugins].filter(Boolean), // ✅ Correct way to use NativeWind plugin
  };
};