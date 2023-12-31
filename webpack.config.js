const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/base-rawen/command/agent-command.ts',
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
        filename: 'base-agent.js', // Output file
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd', // Universal module definition
    },
};
