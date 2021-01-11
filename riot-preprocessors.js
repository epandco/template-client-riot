const { join } = require('path');
const { initRiotTypeScriptPreprocessor } = require('@epandco/riot-typescript-preprocessor');
const { registerPreprocessor } = require('@riotjs/compiler');
const stripIndent = require('strip-indent');
const stylelint = require('stylelint');
const sass = require('sass');

initRiotTypeScriptPreprocessor(registerPreprocessor, {
  riotTypingsPath: join(__dirname, 'src', 'typings.d.ts'),
  tsconfigPath: join(__dirname, 'tsconfig.json')
});

registerPreprocessor('css', 'scss', (source, { options }) => {
  const { file } = options;

  stylelint.lint({
    configFile: join(__dirname, '.stylelintrc'),
    code: stripIndent(source),
    codeFilename: file,
    formatter: 'string'
  }).then((data) => {
    if (data.errored) {
      console.log(data.output);
    }
  });

  const { css } = sass.renderSync({
    data: source,
    includePaths: [
      join(__dirname, 'src', 'sass')
    ],
    outputStyle: 'compressed'
  });

  return {
    code: css.toString(),
    map: null
  };
});