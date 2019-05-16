const path = require('path');

module.exports = {
    entry: {
        index: './src/index.js'
    },
    externals: {'firebase-admin': "require('firebase-admin')"},
    target: 'node',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            { test: /\.js$/, use: 'babel-loader', include: [path.resolve(__dirname, 'src')] }
        ]
    }
};