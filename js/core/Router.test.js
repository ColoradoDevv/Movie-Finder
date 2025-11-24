/**
 * Router.test.js
 * Tests unitarios para Router.js usando Jest
 */

import { Router } from './Router.js';
import { jest } from '@jest/globals';

describe('Router Module', () => {
    let router;
    let mockState;

    beforeEach(() => {
        // Mock del State
        mockState = {
            set: jest.fn(),
            get: jest.fn()
        };

        router = new Router(mockState);
        // Silenciar logs
        // jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize correctly', () => {
        expect(router).toBeDefined();
    });

    test('should throw error if initialized without state', () => {
        expect(() => new Router()).toThrow('Router requires a State instance');
    });

    test('should register routes', () => {
        const handler = jest.fn();
        router.register('home', handler);
        expect(router.hasRoute('home')).toBe(true);
    });

    test('should navigate to a registered route', async () => {
        const handler = jest.fn().mockResolvedValue('success');
        router.register('home', handler);

        await router.navigate('home', { id: 1 });

        expect(handler).toHaveBeenCalledWith({ id: 1 });
        expect(mockState.set).toHaveBeenCalledWith('navigation.currentSection', 'home');
        expect(router.getCurrentRoute()).toBe('home');
    });

    test('should handle route not found', async () => {
        // Mock fallback route
        const popularHandler = jest.fn();
        router.register('popular', popularHandler);

        await router.navigate('non-existent');

        expect(popularHandler).toHaveBeenCalled();
        expect(router.getCurrentRoute()).toBe('popular');
    });

    test('should execute before middleware', async () => {
        const handler = jest.fn();
        const beforeMiddleware = jest.fn().mockReturnValue(true);

        router.register('protected', handler, { before: beforeMiddleware });

        await router.navigate('protected');

        expect(beforeMiddleware).toHaveBeenCalled();
        expect(handler).toHaveBeenCalled();
    });

    test('should block navigation if before middleware returns false', async () => {
        const handler = jest.fn();
        const beforeMiddleware = jest.fn().mockReturnValue(false);

        router.register('protected', handler, { before: beforeMiddleware });

        await router.navigate('protected');

        expect(beforeMiddleware).toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
    });

    test('should go back to popular (default implementation)', async () => {
        const popularHandler = jest.fn();
        router.register('popular', popularHandler);

        await router.back();

        expect(popularHandler).toHaveBeenCalled();
        expect(router.getCurrentRoute()).toBe('popular');
    });
});
