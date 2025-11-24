# Manual Testing Guide - Refactors #1 & #2

## ✅ Automated Tests Completed
- **Unit Tests:** 32/32 passing
- **Coverage:** 54.33% total, 80.76% services
- **Initial Load:** ✅ 20 movies loaded, no console errors

---

## 🧪 Manual Browser Tests

### Test 1: Router Navigation (Refactor #1)
**Steps:**
1. Open http://127.0.0.1:5500/index.html
2. Click on "Favoritos" in the sidebar
3. Verify URL changes to `#/favorites`
4. Click on "Populares"
5. Verify URL changes back to `#/` or `#/home`

**Expected Result:** ✅ Navigation works smoothly, URL updates correctly

---

### Test 2: State Management - Add to Favorites (Refactor #1)
**Steps:**
1. On the home page, click any movie card
2. In the modal, click the heart icon "Añadir a favoritos"
3. Close the modal (click X or outside)
4. Click "Favoritos" in sidebar
5. Verify the movie appears in the favorites list

**Expected Result:** ✅ Movie is saved and appears in favorites

---

### Test 3: State Management - Add to Watched (Refactor #1)
**Steps:**
1. Click any movie card
2. In the modal, click the checkmark icon "Marcar como vista"
3. Close the modal
4. Click "Vistas" in sidebar
5. Verify the movie appears in the watched list

**Expected Result:** ✅ Movie is saved and appears in watched list

---

### Test 4: TMDBService - Different Endpoints (Refactor #2)
**Steps:**
1. Click "Top Rated" in sidebar
2. Verify different movies load
3. Click "Próximas" (Upcoming)
4. Verify upcoming movies load
5. Open browser console (F12) and check for errors

**Expected Result:** ✅ All endpoints work, no console errors

---

### Test 5: FiltersService - Filtering (Refactor #2)
**Steps:**
1. Go to "Populares"
2. In the filters section, select a year (e.g., "2023")
3. Verify only 2023 movies are shown
4. Select a rating filter (e.g., "7+")
5. Verify only movies with 7+ rating are shown
6. Change sort to "Mejor Valoradas"
7. Verify movies are sorted by rating

**Expected Result:** ✅ Filters work correctly, movies update

---

### Test 6: Search Functionality (Refactor #2)
**Steps:**
1. Click on the search bar
2. Type "Matrix"
3. Press Enter or click search
4. Verify Matrix movies appear

**Expected Result:** ✅ Search returns relevant results

---

### Test 7: Recommendations (Refactor #2)
**Steps:**
1. Click "Sorpréndeme" button
2. Verify a random movie is recommended
3. Click it again
4. Verify a different movie is shown

**Expected Result:** ✅ Random recommendations work

---

### Test 8: Modal - Similar Movies (Refactor #2)
**Steps:**
1. Click any movie card
2. Scroll down in the modal to "Películas similares"
3. Click on a similar movie
4. Verify the modal updates with the new movie details

**Expected Result:** ✅ Modal updates correctly with new movie

---

### Test 9: EventBus Communication (Refactor #1)
**Steps:**
1. Add a movie to favorites from the modal
2. Without closing the modal, check if the heart icon changes to "active" state
3. Remove from favorites
4. Verify the heart icon changes back

**Expected Result:** ✅ UI updates reactively via EventBus

---

### Test 10: Console Errors Check
**Steps:**
1. Open browser console (F12)
2. Perform all the above tests
3. Check for any red errors in console

**Expected Result:** ✅ No errors, only info/debug logs

---

## 📊 Testing Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Unit Tests | ✅ PASS | 32/32 |
| Initial Load | ✅ PASS | 20 movies, no errors |
| Router Navigation | ⏳ PENDING | Manual test |
| State - Favorites | ⏳ PENDING | Manual test |
| State - Watched | ⏳ PENDING | Manual test |
| TMDBService | ⏳ PENDING | Manual test |
| FiltersService | ⏳ PENDING | Manual test |
| Search | ⏳ PENDING | Manual test |
| Recommendations | ⏳ PENDING | Manual test |
| Modal Similar Movies | ⏳ PENDING | Manual test |
| EventBus | ⏳ PENDING | Manual test |
| Console Errors | ⏳ PENDING | Manual test |

---

## 🐛 Known Issues to Check

1. **ui.js error (FIXED):** `img is not defined` - should be resolved
2. **Import paths:** All should use new service paths
3. **Event listener cleanup:** Modal should clean up listeners properly

---

## ✅ Ready for Refactor #3 When:

- [ ] All manual tests pass
- [ ] No console errors
- [ ] State persists correctly
- [ ] All services work as expected
