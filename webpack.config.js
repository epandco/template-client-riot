const { join } = require('path');
const { readdirSync, existsSync } = require('fs');
const { homedir } = require('os');

const { registerPreprocessor } = require('@riotjs/compiler');
const { initRiotSassPreprocessor } = require('@epandco/riot-sass-preprocessor');
const { initRiotTypeScriptPreprocessor } = require('@epandco/riot-typescript-preprocessor');

const { HotModuleReplacementPlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

require('dotenv').config({
  path: join(__dirname, '.env')
});

const LOCALHOST_CERT = process.env.hasOwnProperty('LOCALHOST_CERT')
  ? process.env['LOCALHOST_CERT'].replace('~', homedir())
  : join(homedir(), '.unthink', 'certs', 'localhost.crt');

const LOCALHOST_KEY = process.env.hasOwnProperty('LOCALHOST_KEY')
  ? process.env['LOCALHOST_KEY'].replace('~', homedir())
  : join(homedir(), '.unthink', 'certs', 'localhost.key');

initRiotSassPreprocessor(registerPreprocessor);

initRiotTypeScriptPreprocessor(registerPreprocessor, {
  riotTypingsPath: join(__dirname, 'src', 'typings.d.ts'),
  tsconfigPath: join(__dirname, 'tsconfig.json')
});

function getEntries() {
  const entries = {};

  readdirSync(join(__dirname, 'src', 'entries'), { withFileTypes: true })
    .forEach((dirent) => {
      if (!dirent.isDirectory()) {
        return;
      }

      const entryPath = join(__dirname, 'src', 'entries', dirent.name, `${dirent.name}.ts`);

      if (existsSync(entryPath)) {
        entries[dirent.name] = entryPath;
      }
    });

  return entries;
}

const babelOptions = {
  cacheDirectory: true,
  presets: [
    ['@babel/preset-env', { 'targets': 'ie >= 11' }]
  ],
};

module.exports = (env = {}) => {
  return {
    mode: env.production ? 'production' : 'development',
    devtool: env.production ? 'source-map' : 'inline-source-map',
    stats: 'errors-warnings',
    entry: {
      'polyfills-es5': join(__dirname, 'src', 'polyfills', 'polyfills-es5.js'),
      'polyfills-es2015': join(__dirname, 'src', 'polyfills', 'polyfills-es2015.js'),
      ...getEntries()
    },
    output: {
      filename: '[name].bundle.js',
      path: join(__dirname, 'public', 'js'),
      publicPath: '/public/js/'
    },
    resolve: {
      extensions: ['.js', '.ts', '.riot'],
    },
    module: {
      rules: [
        {
          test: /\.riot$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: babelOptions
            },
            {
              loader: '@riotjs/webpack-loader',
              options: {
                hot: true
              }
            }
          ]
        },
        {
          test: /\.js$/,
          exclude: /core-js/,
          use: {
            loader: 'babel-loader',
            options: babelOptions
          }
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: babelOptions
            },
            {
              loader: 'ts-loader'
            }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      ...(env.production ? [] : [new HotModuleReplacementPlugin()])
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false
            }
          },
          extractComments: false
        })
      ]
    },
    devServer: {
      port: 3030,
      contentBase: join(__dirname, 'public'),
      publicPath: '/js/',
      https: {
        cert: LOCALHOST_CERT,
        key: LOCALHOST_KEY
      },
      hot: true,
      stats: 'errors-only'
    }
  }
}