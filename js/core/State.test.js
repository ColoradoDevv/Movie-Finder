/**
 * State.test.js
 * Tests unitarios para State.js usando Jest
 */

import { State } from './State.js';
import { jest } from '@jest/globals';

describe('State Module', () => {
    let state;

    beforeEach(() => {
        state = new State();
        // Silenciar logs durante tests si es necesario
        // jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize correctly', () => {
        expect(state).toBeDefined();
        expect(state.getAll()).toBeDefined();
    });

    test('should get and set values correctly', () => {
        state.set('pagination.currentPage', 5);
        expect(state.get('pagination.currentPage')).toBe(5);
    });

    test('should notify subscribers on change', () => {
        const callback = jest.fn();
        state.subscribe('filters.year', callback);

        state.set('filters.year', '2024');

        expect(callback).toHaveBeenCalledTimes(1);
        // El segundo argumento es el valor anterior, que inicialmente es ''
        expect(callback).toHaveBeenCalledWith('2024', '');
    });

    test('should handle multiple listeners', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        state.subscribe('filters.rating', callback1);
        state.subscribe('filters.rating', callback2);

        state.set('filters.rating', '8');

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
    });

    test('should notify parent paths', () => {
        const parentCallback = jest.fn();
        state.subscribe('pagination', parentCallback);

        state.set('pagination.totalPages', 10);

        expect(parentCallback).toHaveBeenCalled();
    });

    test('should reset a section to defaults', () => {
        state.set('filters.year', '2023');
        state.reset('filters');
        expect(state.get('filters.year')).toBe('');
    });

    test('should unsubscribe correctly', () => {
        const callback = jest.fn();
        const unsub = state.subscribe('navigation.currentSection', callback);

        state.set('navigation.currentSection', 'favorites');
        expect(callback).toHaveBeenCalledTimes(1);

        unsub();

        state.set('navigation.currentSection', 'history');
        expect(callback).toHaveBeenCalledTimes(1); // Should not increase
    });

    test('should have debug methods', () => {
        expect(() => state.debug()).not.toThrow();
        expect(() => state.debugListeners()).not.toThrow();
    });
});
