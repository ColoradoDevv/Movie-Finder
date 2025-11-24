module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    verbose: true,
    testMatch: ['**/*.test.js'],
};
