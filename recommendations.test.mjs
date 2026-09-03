// Tests for the recommendation engine.
//
// These exercise only the observable contract of recommendBooks: given a
// collection and a set of liked ids, which books come back and in what order.
// They never assert the scoring weights or reach into internals — ranking is
// checked relatively so the weights stay tunable.
//
// Run: node --test recommendations.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';

import { recommendBooks } from './recommendations.mjs';

// Fixture catalog — shaped like books-data.js records, trimmed to the fields
// the engine reads (id, author, category, year). title is kept for readability.
const CATALOG = [
  { id: 1,  title: 'Dune',             author: 'Frank Herbert',     category: 'Sci-Fi',      year: 1965 },
  { id: 2,  title: 'Dune Messiah',     author: 'Frank Herbert',     category: 'Sci-Fi',      year: 1969 },
  { id: 3,  title: 'Children of Dune', author: 'Frank Herbert',     category: 'Sci-Fi',      year: 1976 },
  { id: 4,  title: 'Neuromancer',      author: 'William Gibson',    category: 'Sci-Fi',      year: 1984 },
  { id: 5,  title: 'Foundation',       author: 'Isaac Asimov',      category: 'Sci-Fi',      year: 1951 },
  { id: 6,  title: 'Hyperion',         author: 'Dan Simmons',       category: 'Sci-Fi',      year: 1989 },
  { id: 7,  title: 'The Hobbit',       author: 'J.R.R. Tolkien',    category: 'Fantasy',     year: 1937 },
  { id: 8,  title: 'The Silmarillion', author: 'J.R.R. Tolkien',    category: 'Fantasy',     year: 1977 },
  { id: 9,  title: 'Mistborn',         author: 'Brandon Sanderson', category: 'Fantasy',     year: 2006 },
  { id: 10, title: 'Educated',         author: 'Tara Westover',     category: 'Non-Fiction', year: 2018 },
];

const idsOf = (books) => books.map((book) => book.id);

test('returns nothing when the reader has liked nothing', () => {
  assert.deepEqual(recommendBooks(CATALOG, []), []);
});

test('treats missing likedIds as no likes rather than throwing', () => {
  assert.deepEqual(recommendBooks(CATALOG, undefined), []);
});

test('returns nothing when the liked ids match no book in the catalog', () => {
  assert.deepEqual(recommendBooks(CATALOG, [999]), []);
});

test('never recommends a book the reader has already liked', () => {
  const result = recommendBooks(CATALOG, [1, 2], { limit: 10 });
  assert.ok(result.every((book) => book.id !== 1 && book.id !== 2));
});

test('never recommends a book with no author or category overlap', () => {
  // Liking one Fantasy book by Tolkien: only other Fantasy books can score.
  const result = recommendBooks(CATALOG, [7], { limit: 10 });
  assert.deepEqual(idsOf(result), [8, 9]);
});

test('ranks every author match above every category-only match', () => {
  const ids = idsOf(recommendBooks(CATALOG, [1], { limit: 10 }));
  const authorMatches = [2, 3]; // also by Frank Herbert
  const categoryOnly = [4, 5, 6]; // Sci-Fi, but different authors

  const lastAuthorMatch = Math.max(...authorMatches.map((id) => ids.indexOf(id)));
  const firstCategoryOnly = Math.min(...categoryOnly.map((id) => ids.indexOf(id)));
  assert.ok(lastAuthorMatch < firstCategoryOnly);
});

test('ranks a book overlapping more liked books above one overlapping fewer', () => {
  // Liked: two Sci-Fi books (1, 5) and one Fantasy book (7).
  const ids = idsOf(recommendBooks(CATALOG, [1, 5, 7], { limit: 10 }));
  // id 4 shares its category with two liked books; id 9 with only one.
  assert.ok(ids.indexOf(4) < ids.indexOf(9));
});

test('caps the result at the requested limit', () => {
  const result = recommendBooks(CATALOG, [1], { limit: 2 });
  assert.equal(result.length, 2);
  assert.deepEqual(idsOf(result), [3, 2]);
});

test('defaults to four recommendations', () => {
  // Liking id 1 leaves five overlapping candidates (2, 3, 4, 5, 6).
  const result = recommendBooks(CATALOG, [1]);
  assert.equal(result.length, 4);
});

test('returns a short list when fewer books overlap than the limit', () => {
  const result = recommendBooks(CATALOG, [7]); // only ids 8 and 9 overlap
  assert.deepEqual(idsOf(result), [8, 9]);
});

test('breaks a score tie by newer book first', () => {
  // ids 2 and 3 share a score (both by Frank Herbert, both Sci-Fi);
  // id 3 (1976) is newer than id 2 (1969).
  const ids = idsOf(recommendBooks(CATALOG, [1], { limit: 10 }));
  assert.ok(ids.indexOf(3) < ids.indexOf(2));
});

test('breaks a score-and-year tie by lower id first', () => {
  const tied = [
    { id: 50, title: 'Anchor', author: 'A', category: 'X', year: 2000 },
    { id: 42, title: 'Beta',   author: 'A', category: 'X', year: 1990 },
    { id: 17, title: 'Gamma',  author: 'A', category: 'X', year: 1990 },
  ];
  const result = recommendBooks(tied, [50], { limit: 10 });
  assert.deepEqual(idsOf(result), [17, 42]);
});

test('is deterministic across repeated calls with the same input', () => {
  const first = recommendBooks(CATALOG, [1, 7], { limit: 10 });
  const second = recommendBooks(CATALOG, [1, 7], { limit: 10 });
  assert.deepEqual(idsOf(first), idsOf(second));
});

test('accepts a Set of liked ids as well as an array', () => {
  const fromArray = recommendBooks(CATALOG, [1, 5], { limit: 10 });
  const fromSet = recommendBooks(CATALOG, new Set([1, 5]), { limit: 10 });
  assert.deepEqual(idsOf(fromArray), idsOf(fromSet));
});

test('treats a limit of zero as no recommendations', () => {
  assert.deepEqual(recommendBooks(CATALOG, [1], { limit: 0 }), []);
});
