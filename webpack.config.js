const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/base-rawen/command/see-act-agent.ts',
    // entry: './src/base-rawen/command/mark-and-informate.ts',
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
        // filename: 'mark-info.js', // Output file
        filename: 'seeAct.js', // Output file
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd', // Universal module definition
    },
};
