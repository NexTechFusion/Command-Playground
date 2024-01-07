const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/reface.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'reface.js', // Output file
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd', // Universal module definition
    },
};
