var path = require('path');

module.exports = {
    entry: "./public/javascripts/chat-core.ts",
    output: {
        filename: "chat-core.js",
        path: path.resolve(__dirname, 'public/javascripts/')
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
        {
            test: /\.tsx?$/,
            loader: "ts-loader" ,
            exclude: /node_modules/
        },

        ]
    }
}
