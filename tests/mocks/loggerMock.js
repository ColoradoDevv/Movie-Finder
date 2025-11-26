const mockLoggerInstance = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    debug: jest.fn(),
    time: jest.fn(),
    timeEnd: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn()
};

module.exports = {
    __esModule: true,
    default: jest.fn(() => mockLoggerInstance),
    mainLogger: mockLoggerInstance,
    uiLogger: mockLoggerInstance,
    apiLogger: mockLoggerInstance,
    storageLogger: mockLoggerInstance,
    modalLogger: mockLoggerInstance,
    recommendationsLogger: mockLoggerInstance
};
