# Core Modules Documentation

## Overview

The Core layer provides the foundational infrastructure for the application. It is designed to be decoupled, testable, and scalable.

## Modules

### 1. State (`js/core/State.js`)

Centralized state management using the Observer pattern.

**Key Features:**
- **Reactive State:** Components can subscribe to changes in specific parts of the state.
- **Path Notation:** Access and update nested state using dot notation (e.g., `'filters.year'`).
- **Immutability:** `getAll()` returns a deep copy to prevent accidental mutations.

**Usage:**
```javascript
import { State } from './core/State.js';

const state = new State();

// Subscribe to changes
state.subscribe('user.favorites', (favorites) => {
    console.log('Favorites updated:', favorites);
});

// Update state
state.set('user.favorites', [101, 102]);
```

### 2. Router (`js/core/Router.js`)

Client-side routing system for single-page application (SPA) navigation.

**Key Features:**
- **Route Registration:** Map string names to async handler functions.
- **Middleware:** Support for `before` (guards) and `after` hooks.
- **Navigation:** Programmatic navigation with `navigate(routeName, params)`.

**Usage:**
```javascript
import { Router } from './core/Router.js';

const router = new Router(state);

router.register('home', async () => {
    // Load home view
});

router.navigate('home');
```

### 3. EventBus (`js/core/EventBus.js`)

Decoupled communication channel using the Publish/Subscribe pattern.

**Key Features:**
- **Decoupling:** Modules communicate without direct dependencies.
- **Async Support:** `emitAsync` for non-blocking event handling.
- **History:** Tracks recent events for debugging.

**Usage:**
```javascript
import { EventBus } from './core/EventBus.js';

const eventBus = new EventBus();

// Subscribe
eventBus.on('movie:selected', (movieId) => {
    console.log('Movie selected:', movieId);
});

// Publish
eventBus.emit('movie:selected', 12345);
```
