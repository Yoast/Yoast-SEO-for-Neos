module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:prettier/recommended'],
    plugins: ['prettier', 'react', 'react-hooks'],
    settings: {
        react: {
            version: 'detect',
        },
    },
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 8,
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
        },
    },
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    rules: {
        'prettier/prettier': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
};
