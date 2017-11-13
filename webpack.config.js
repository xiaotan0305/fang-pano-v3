var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var libraryName = 'pano';
var env = process.env.WEBPACK_ENV;
var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'src');
var BUILD_PATH = path.resolve(ROOT_PATH, 'dist');

var dev = env === 'dev';
var plugins = [].concat(dev ? [] : [
    new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compressor: {
            warnings: false,
            conditionals: true,
            unused: true,
            comparisons: true,
            sequences: true,
            dead_code: true,
            evaluate: true,
            if_return: true,
            join_vars: true,
            negate_iife: false
        },
        output: {
            comments: false
        }
    }),
    new ExtractTextPlugin('css.css')
]);

let entryConfig = {
    loader: './src/js/loader.js'
};
entryConfig[libraryName] = './src/js/pano.js';
module.exports = {
    entry: entryConfig,
    output: {
        path: BUILD_PATH,
        filename: '[name].min.js',
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },

    devtool: dev ? 'eval-source-map' : 'source-map',

    devServer: {
        publicPath: '/dist/'
    },

    module: {
        rules: [{
            test: /\.js$/,
            loader: 'template-string-optimize-loader',
            include: APP_PATH
        },
        {
            test: /\.js$/,
            loader: 'babel-loader',
            include: APP_PATH,
            options: {
                presets: ['env'],
                plugins: ['transform-remove-strict-mode']
            }
        },
        {
            test: /\.(png|jpg)$/,
            loader: 'url-loader?limit=40000'
        }
        ]
    },

    plugins: plugins
};