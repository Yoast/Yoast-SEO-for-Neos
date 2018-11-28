const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

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

const browserSync = new BrowserSyncPlugin();

module.exports = [
    {
        entry: ['../App.js'],
        output: {
            filename: 'App.js',
            path: path.resolve(__dirname, '../../../Public/Scripts')
        },
        devtool: devMode ? "cheap-module-eval-source-map" : '',
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: extractSass.extract({
                        use: [{
                            loader: "css-loader",
                            options: {
                                sourceMap: devMode
                            }
                        }, {
                            loader: "sass-loader",
                            options: {
                                sourceMap: devMode,
                                options: {
                                    includePaths: [
                                        path.resolve('node_modules')
                                    ]
                                }
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
            uglifyJs,
            browserSync
        ]
    },
    {
        entry: ['./src/WebWorker.js'],
        output: {
            filename: 'WebWorker.js',
            path: path.resolve(__dirname, '../../../Public/Scripts')
        },
        plugins: [
            uglifyJs
        ]
    }
];
