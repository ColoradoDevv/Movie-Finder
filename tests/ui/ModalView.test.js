/**
 * @jest-environment jsdom
 */

import { ModalView } from '../../js/ui/views/ModalView.js';
import { Modal } from '../../js/ui/components/Modal.js';
import { TMDBService } from '../../js/services/TMDBService.js';

// Mock dependencies
jest.mock('../../js/ui/components/Modal.js');
jest.mock('../../js/services/TMDBService.js');

describe('ModalView', () => {
    let modalElement;
    let modalView;
    let mockModal;

    beforeEach(() => {
        // Create required DOM structure
        modalElement = document.createElement('div');
        modalElement.id = 'movie-modal';
        document.body.appendChild(modalElement);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        document.body.appendChild(closeBtn);

        // Mock Modal instance
        mockModal = {
            open: jest.fn(),
            close: jest.fn()
        };
        Modal.mockImplementation(() => mockModal);

        // Create ModalView instance
        modalView = new ModalView();
    });

    afterEach(() => {
        // Clean up DOM
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should create ModalView instance', () => {
            expect(modalView).toBeInstanceOf(ModalView);
            expect(modalView.modal).toBe(mockModal);
        });

        test('should throw error if modal element not found', () => {
            document.body.innerHTML = '';
            expect(() => new ModalView()).toThrow('No se encontró el elemento del modal en el DOM');
        });

        test('should create Modal component with correct element', () => {
            expect(Modal).toHaveBeenCalledWith(modalElement);
        });
    });

    describe('showMovie()', () => {
        const mockMovieDetails = {
            id: 550,
            title: 'Fight Club',
            overview: 'Test overview',
            vote_average: 8.4,
            release_date: '1999-10-15',
            videos: { results: [] },
            genres: [{ id: 18, name: 'Drama' }]
        };

        beforeEach(() => {
            TMDBService.getMovieDetails = jest.fn().mockResolvedValue(mockMovieDetails);
        });

        test('should fetch movie details and open modal', async () => {
            await modalView.showMovie(550);

            expect(TMDBService.getMovieDetails).toHaveBeenCalledWith(550);
            expect(mockModal.open).toHaveBeenCalledWith(mockMovieDetails);
        });

        test('should handle fetch errors gracefully', async () => {
            TMDBService.getMovieDetails.mockRejectedValue(new Error('Network error'));

            await modalView.showMovie(550);

            expect(mockModal.open).not.toHaveBeenCalled();
        });

        test('should not open modal if details are null', async () => {
            TMDBService.getMovieDetails.mockResolvedValue(null);

            await modalView.showMovie(550);

            expect(mockModal.open).not.toHaveBeenCalled();
        });

        test('should not fetch if movieId is invalid', async () => {
            await modalView.showMovie(null);

            expect(TMDBService.getMovieDetails).not.toHaveBeenCalled();
            expect(mockModal.open).not.toHaveBeenCalled();
        });
    });

    describe('showMovieDetails()', () => {
        const mockMovieDetails = {
            id: 550,
            title: 'Fight Club',
            overview: 'Test overview'
        };

        test('should open modal with provided details', () => {
            modalView.showMovieDetails(mockMovieDetails);

            expect(mockModal.open).toHaveBeenCalledWith(mockMovieDetails);
        });

        test('should not open modal if details are null', () => {
            modalView.showMovieDetails(null);

            expect(mockModal.open).not.toHaveBeenCalled();
        });
    });

    describe('close()', () => {
        test('should close the modal', () => {
            modalView.close();

            expect(mockModal.close).toHaveBeenCalled();
        });
    });

    describe('Global Event Listeners', () => {
        test('should close modal when clicking overlay', () => {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(clickEvent, 'target', {
                value: modalElement,
                writable: false
            });

            modalElement.dispatchEvent(clickEvent);

            expect(mockModal.close).toHaveBeenCalled();
        });

        test('should not close modal when clicking inside content', () => {
            const contentElement = document.createElement('div');
            modalElement.appendChild(contentElement);

            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(clickEvent, 'target', {
                value: contentElement,
                writable: false
            });

            modalElement.dispatchEvent(clickEvent);

            expect(mockModal.close).not.toHaveBeenCalled();
        });

        test('should close modal when clicking close button', () => {
            const closeBtn = document.querySelector('.close-modal');
            closeBtn.click();

            expect(mockModal.close).toHaveBeenCalled();
        });
    });
});
