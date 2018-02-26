// This library allows us to combine paths easily
const path = require('path');
module.exports = {
    entry: path.resolve(__dirname, 'src', './main.js'),
    output: {
	path: path.resolve(__dirname, 'output'),
	filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js']
    },
    module: {
	rules: [
            {
                test: /\.js/,
                use: {
	             loader: 'babel-loader',
	             options: { presets: ['react', 'es2015', 'stage-0'] }
                }
	    }
        ]
    }
};