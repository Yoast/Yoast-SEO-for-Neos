const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const webpackConfig = [
    {
        entry: './src/index.jsx',
        devtool: 'eval',
        performance: {
            maxEntrypointSize: 4000000,
            maxAssetSize: 4000000,
        },
        watchOptions: {
            aggregateTimeout: 300,
            ignored: /node_modules/,
        },
        output: {
            filename: 'app.js',
            path: path.resolve(__dirname, '../../../Public/Assets'),
        },
        resolve: {
            modules: ['node_modules'],
            extensions: ['.json', '.js', '.jsx'],
        },
        externals: {
            yoastseo: 'yoastseo',
        },
        optimization: {
            minimizer: [new TerserPlugin()],
        },
        module: {
            rules: [
                {
                    test: /\.(eot|svg|ttf|woff|woff2)$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                        },
                    },
                },
                {
                    test: /\.s?css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                            },
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ],
                },
                {
                    test: /\.(js|jsx)$/,
                    exclude: [/node_modules\/(?!yoast-components)(?!yoastseo)(?!@yoast).*$/],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react'],
                        },
                    },
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css',
            }),
        ],
    },
    {
        entry: ['./src/webWorker.js'],
        output: {
            filename: 'webWorker.js',
            path: path.resolve(__dirname, '../../../Public/Assets'),
        },
        optimization: {
            minimizer: [new TerserPlugin()],
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: [/node_modules\/(?!yoast-components)(?!yoastseo)(?!@yoast).*$/],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/env'],
                            plugins: ['@babel/plugin-transform-modules-umd'],
                        },
                    },
                },
            ],
        },
    },
    {
        entry: ['./src/yoastseo.js'],
        output: {
            filename: 'yoastseo.js',
            path: path.resolve(__dirname, '../../../Public/Assets'),
        },
        optimization: {
            minimizer: [new TerserPlugin()],
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: [/node_modules\/(?!yoast-components)(?!yoastseo)(?!@yoast).*$/],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/env'],
                        },
                    },
                },
            ],
        },
    },
];

module.exports = webpackConfig;
