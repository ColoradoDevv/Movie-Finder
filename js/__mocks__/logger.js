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

export const mainLogger = mockLoggerInstance;
export const uiLogger = mockLoggerInstance;
export const apiLogger = mockLoggerInstance;
export const storageLogger = mockLoggerInstance;
export const modalLogger = mockLoggerInstance;
export const recommendationsLogger = mockLoggerInstance;

export default jest.fn(() => mockLoggerInstance);
