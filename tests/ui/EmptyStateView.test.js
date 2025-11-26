/**
 * @jest-environment jsdom
 */

import { EmptyStateView } from '../../js/ui/views/EmptyStateView.js';

describe('EmptyStateView', () => {
    let container;
    let emptyStateView;

    beforeEach(() => {
        // Create container
        container = document.createElement('div');
        container.id = 'results-grid';
        document.body.appendChild(container);

        // Create EmptyStateView instance
        emptyStateView = new EmptyStateView(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('Constructor', () => {
        test('should create EmptyStateView instance with valid container', () => {
            expect(emptyStateView.container).toBe(container);
        });

        test('should throw error if container is null', () => {
            expect(() => new EmptyStateView(null)).toThrow('EmptyStateView requiere un contenedor válido');
        });
    });

    describe('show()', () => {
        test('should display message in container', () => {
            const message = 'No se encontraron resultados';
            emptyStateView.show(message);

            expect(container.innerHTML).toContain(message);
            expect(container.querySelector('.empty-message')).toBeTruthy();
        });

        test('should display info type by default', () => {
            emptyStateView.show('Test message');

            const emptyMessage = container.querySelector('.empty-message');
            expect(emptyMessage.classList.contains('empty-message--info')).toBe(true);
        });

        test('should display warning type when specified', () => {
            emptyStateView.show('Warning message', 'warning');

            const emptyMessage = container.querySelector('.empty-message');
            expect(emptyMessage.classList.contains('empty-message--warning')).toBe(true);
        });

        test('should display error type when specified', () => {
            emptyStateView.show('Error message', 'error');

            const emptyMessage = container.querySelector('.empty-message');
            expect(emptyMessage.classList.contains('empty-message--error')).toBe(true);
        });

        test('should replace previous message', () => {
            emptyStateView.show('First message');
            emptyStateView.show('Second message');

            expect(container.innerHTML).toContain('Second message');
            expect(container.innerHTML).not.toContain('First message');
        });

        test('should not display message if message is empty', () => {
            emptyStateView.show('');

            expect(container.innerHTML).toBe('');
        });

        test('should not display message if message is null', () => {
            emptyStateView.show(null);

            expect(container.innerHTML).toBe('');
        });
    });

    describe('hide()', () => {
        test('should clear container when hiding', () => {
            emptyStateView.show('Test message');
            expect(container.innerHTML).not.toBe('');

            emptyStateView.hide();

            expect(container.innerHTML).toBe('');
        });

        test('should not throw error if no message is shown', () => {
            expect(() => emptyStateView.hide()).not.toThrow();
        });
    });

    describe('clear()', () => {
        test('should clear container completely', () => {
            emptyStateView.show('Test message');
            expect(container.innerHTML).not.toBe('');

            emptyStateView.clear();

            expect(container.innerHTML).toBe('');
        });

        test('should handle clearing empty container', () => {
            expect(() => emptyStateView.clear()).not.toThrow();
            expect(container.innerHTML).toBe('');
        });
    });
});
