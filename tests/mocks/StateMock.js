export class StateMock {
    constructor() {
        this.data = {
            pagination: { currentPage: 1, totalPages: 1 },
            navigation: { currentSection: 'popular', currentEndpoint: 'movie/popular' },
            movies: { cache: [], searchQuery: '' },
            filters: { sortBy: 'default', year: '', rating: '' },
            user: { favorites: [], watched: [] },
            recommendations: { history: [], currentMovie: null, genre: null }
        };
        this.subscribers = {};
    }

    get(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], this.data);
    }

    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.data);
        target[lastKey] = value;

        if (this.subscribers[path]) {
            this.subscribers[path].forEach(cb => cb(value));
        }
    }

    subscribe(path, callback) {
        if (!this.subscribers[path]) {
            this.subscribers[path] = [];
        }
        this.subscribers[path].push(callback);
    }
}
