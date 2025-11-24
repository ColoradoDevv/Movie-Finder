/**
 * EventBus.test.js
 * Tests unitarios para EventBus.js usando Jest
 */

import { EventBus } from './EventBus.js';
import { jest } from '@jest/globals';

describe('EventBus Module', () => {
    let eventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize correctly', () => {
        expect(eventBus).toBeDefined();
    });

    test('should subscribe and emit events', () => {
        const callback = jest.fn();
        eventBus.on('test-event', callback);

        eventBus.emit('test-event', { data: 123 });

        expect(callback).toHaveBeenCalledWith({ data: 123 });
    });

    test('should handle multiple listeners for same event', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        eventBus.on('shared-event', callback1);
        eventBus.on('shared-event', callback2);

        eventBus.emit('shared-event');

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
    });

    test('should unsubscribe correctly', () => {
        const callback = jest.fn();
        const unsub = eventBus.on('temp-event', callback);

        eventBus.emit('temp-event');
        expect(callback).toHaveBeenCalledTimes(1);

        unsub();

        eventBus.emit('temp-event');
        expect(callback).toHaveBeenCalledTimes(1); // Should not increase
    });

    test('should handle once subscription', () => {
        const callback = jest.fn();
        eventBus.once('one-time', callback);

        eventBus.emit('one-time');
        eventBus.emit('one-time');

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should emit async events', async () => {
        const callback = jest.fn().mockResolvedValue('done');
        eventBus.on('async-event', callback);

        await eventBus.emitAsync('async-event');

        expect(callback).toHaveBeenCalled();
    });

    test('should clear all listeners', () => {
        const callback = jest.fn();
        eventBus.on('event1', callback);
        eventBus.on('event2', callback);

        eventBus.clear();

        expect(eventBus.getActiveEvents()).toHaveLength(0);
    });

    test('should track history', () => {
        eventBus.emit('history-event', 'data1');
        eventBus.emit('history-event', 'data2');

        const history = eventBus.getHistory();
        expect(history).toHaveLength(2);
        expect(history[0].eventName).toBe('history-event');
        expect(history[0].data).toBe('data1');
    });
});
