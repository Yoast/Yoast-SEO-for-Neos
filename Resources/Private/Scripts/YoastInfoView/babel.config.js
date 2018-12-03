module.exports = function (api) {
    api.cache(true);

    const presets = [
        "@babel/env",
        "@babel/react"
    ];

    const plugins = [
        ["@babel/transform-react-jsx"],
        ["@babel/transform-runtime", {"helpers": false}],
        ["@babel/plugin-proposal-decorators", {"legacy": true}],
        ["@babel/plugin-proposal-class-properties", {"loose": true}],
        ["@babel/plugin-syntax-dynamic-import"]
    ];

    return {
        presets,
        plugins
    };
};
