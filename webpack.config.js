const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/mark-inform.ts',
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
        filename: 'mark-inform.js', // Output file
        path: path.resolve(__dirname, 'dist'),
    },
};
