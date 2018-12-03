const path = require('path');
const webpack = require("webpack");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = [
    {
        entry: [
            '../app.js',
        ],
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
            new UglifyJSPlugin({
                test: /\.js($|\?)/i,
                cache: true,
                parallel: true,
            })
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
