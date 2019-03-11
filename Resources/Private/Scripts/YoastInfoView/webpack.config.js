const path = require('path');
const webpack = require("webpack");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const webpackConfig = [
    {
        entry: [
            '../app.js',
        ],
        watchOptions: {
            aggregateTimeout: 300,
            ignored: /node_modules/
        },
        output: {
            filename: 'app.js',
            path: path.resolve(__dirname, '../../../Public/Assets')
        },
        resolve: {
            extensions: ['.json', '.js', '.jsx']
        },
        module: {
            rules: [
                {
                    test: /\.(eot|svg|ttf|woff|woff2)$/,
                    loader: 'file-loader?name=[name].[ext]'
                },
                {
                    test: /\.s?css$/,
                    use: [
                        ExtractTextPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                importLoaders: 1
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                includePaths: [
                                    path.resolve('node_modules'),
                                ]
                            }
                        }
                    ]
                },
                {
                    test: /\.jsx?$/,
                    loader: 'babel-loader',
                    exclude: [
                        /node_modules\/react/,
                        /node_modules\/react-dom/,
                    ],
                    options: {
                        cacheDirectory: true,
                    }
                },
            ]
        },
        plugins: [
            new webpack.optimize.OccurrenceOrderPlugin(),
            new ExtractTextPlugin({
                filename: "[name].css",
            }),
        ]
    },
    {
        entry: ['./src/webWorker.js'],
        output: {
            filename: 'webWorker.js',
            path: path.resolve(__dirname, '../../../Public/Assets')
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/env'],
                        }
                    }],
                }
            ]
        },
        plugins: [
            new UglifyJSPlugin({
                test: /\.js($|\?)/i,
                cache: true,
                parallel: true,
            })
        ]
    }
];

if (process.env.NODE_ENV !== 'development') {
    webpackConfig.plugins.push(new UglifyJSPlugin({
        test: /\.js($|\?)/i,
        cache: true,
        parallel: true,
    }));
}

module.exports = webpackConfig;
