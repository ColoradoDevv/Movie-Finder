/**
 * State.test.js
 * Tests manuales para State.js
 */

import { State } from './State.js';

console.log('🧪 Testing State.js...\n');

// Test 1: Inicialización
console.log('Test 1: Inicialización');
const state = new State();
console.log('✓ State creado');

// Test 2: Get/Set simple
console.log('\nTest 2: Get/Set simple');
state.set('pagination.currentPage', 5);
const page = state.get('pagination.currentPage');
console.assert(page === 5, '❌ Get/Set falló');
console.log('✓ Get/Set funciona');

// Test 3: Subscriptions
console.log('\nTest 3: Subscriptions');
let callbackExecuted = false;
state.subscribe('filters.year', (newValue) => {
    console.log('  → Callback ejecutado, nuevo valor:', newValue);
    callbackExecuted = true;
});
state.set('filters.year', '2024');
console.assert(callbackExecuted, '❌ Subscription falló');
console.log('✓ Subscriptions funcionan');

// Test 4: Multiple listeners
console.log('\nTest 4: Multiple listeners');
let count = 0;
state.subscribe('filters.rating', () => count++);
state.subscribe('filters.rating', () => count++);
state.set('filters.rating', '8');
console.assert(count === 2, '❌ Multiple listeners falló');
console.log('✓ Multiple listeners funciona');

// Test 5: Nested path notifications
console.log('\nTest 5: Nested path notifications');
let parentNotified = false;
state.subscribe('pagination', () => {
    parentNotified = true;
    console.log('  → Parent listener notificado');
});
state.set('pagination.totalPages', 10);
console.assert(parentNotified, '❌ Parent notification falló');
console.log('✓ Parent notifications funcionan');

// Test 6: Reset
console.log('\nTest 6: Reset');
state.set('filters.year', '2023');
state.reset('filters');
const resetYear = state.get('filters.year');
console.assert(resetYear === '', '❌ Reset falló');
console.log('✓ Reset funciona');

// Test 7: Unsubscribe
console.log('\nTest 7: Unsubscribe');
let unsubCount = 0;
const unsub = state.subscribe('navigation.currentSection', () => unsubCount++);
state.set('navigation.currentSection', 'favorites');
unsub(); // Cancelar suscripción
state.set('navigation.currentSection', 'history');
console.assert(unsubCount === 1, '❌ Unsubscribe falló');
console.log('✓ Unsubscribe funciona');

// Test 8: Debug methods
console.log('\nTest 8: Debug methods');
state.debug();
state.debugListeners();
console.log('✓ Debug methods funcionan');

console.log('\n✅ Todos los tests pasaron!\n');
