const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const devMode = process.env.NODE_ENV === "development";

const extractSass = new ExtractTextPlugin({
    filename: "../Styles/[name].css",
    disable: devMode
});

const uglifyJs = new UglifyJSPlugin({
    test: /\.js($|\?)/i,
    cache: true,
    parallel: true,
    sourceMap: true,
    uglifyOptions: {
        mangle: !devMode,
        compress: !devMode
    }
});

const optimizeCss = new OptimizeCssAssetsPlugin({
    assetNameRegExp: /\.min\.css$/,
    cssProcessorOptions: {
        discardComments: {
            removeAll: true
        }
    }
});

module.exports = {
    entry: './Resources/Private/Scripts/App.js',
    output: {
        filename: 'Bundle.js',
        path: path.resolve(__dirname, 'Resources/Public/Scripts')
    },
    devtool: "cheap-module-eval-source-map",
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: extractSass.extract({
                    use: [{
                        loader: "css-loader",
                        options: {
                            sourceMap: !devMode
                        }
                    }, {
                        loader: "sass-loader",
                        options: {
                            sourceMap: !devMode
                        }
                    }],
                    // use style-loader in development
                    fallback: "style-loader"
                })
            }
        ]
    },
    plugins: [
        extractSass,
        uglifyJs
    ]
};
