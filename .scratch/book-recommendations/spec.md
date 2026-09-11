# Spec: Book recommendations based on liked books

Status: ready-for-agent

## Problem Statement

BookShelf shows the whole collection with search and a category filter, but it does
nothing with what a reader actually cares about. A visitor who has found two or three
books they love gets no help finding the next one — they have to scan the full grid
themselves and guess which titles are "like" the ones they enjoyed. The app knows the
author and category of every book but never puts that knowledge to work for the reader.

## Solution

Let a reader mark books as **liked**, and give them a **"Recommended for you"** section
on the home view that suggests a small number of other books from the existing
collection, chosen because they share an author or a category with books the reader has
already liked. The section reacts immediately as likes are added or removed: like another
fantasy novel and more fantasy rises into the recommendations; unlike it and that
influence disappears. Likes persist across visits on the same browser, matching how the
theme choice is already remembered. No accounts, no network calls, no external catalog —
it all runs off the book data already shipped with the app.

## User Stories

1. As a reader, I want to mark a book as liked from its card in the grid, so that I can record my taste without opening anything.
2. As a reader, I want to mark a book as liked from inside the book detail modal, so that I can decide after reading the description.
3. As a reader, I want to unlike a book I previously liked, so that I can correct a mis-tap or a change of heart.
4. As a reader, I want the like control to show its current state clearly (liked vs. not liked), so that I always know what I have recorded.
5. As a reader, I want my likes to still be there when I come back to the site later on the same browser, so that I do not have to rebuild my taste profile every visit.
6. As a reader, I want a "Recommended for you" section on the home view, so that I have one obvious place to look for my next read.
7. As a reader, I want the recommendations to be based on the authors of books I have liked, so that I can find more from writers I already trust.
8. As a reader, I want the recommendations to be based on the categories of books I have liked, so that I can find more in genres I enjoy.
9. As a reader, I want a book that matches a liked author to rank above a book that only matches a liked category, so that the strongest signal about my taste wins.
10. As a reader, I want a book that overlaps with several of my liked books to rank above a book that overlaps with only one, so that my dominant preferences surface first.
11. As a reader, I want the recommendations to update the moment I like a new book, so that the section reflects my current taste without a page reload.
12. As a reader, I want the recommendations to update the moment I unlike a book, so that a removed preference stops influencing my suggestions.
13. As a reader, I want books I have already liked to be excluded from my recommendations, so that the section only ever shows new things to try.
14. As a reader, I want the recommendations limited to a small list, so that the section is a quick glance and not a second full grid.
15. As a reader, I want to click a recommended book to open its detail modal, so that recommendations behave like every other book in the app.
16. As a reader, I want to like a book directly from the recommendations section, so that I can act on a good suggestion in place.
17. As a reader, I want a book I like from the recommendations section to leave that section afterwards, so that the list keeps moving forward.
18. As a reader who has not liked anything yet, I want the recommendations section to stay out of my way (hidden or showing a short "like some books to get recommendations" prompt), so that the home view is not cluttered with an empty panel.
19. As a reader whose liked books have no other author or category matches in the collection, I want the section to simply show nothing rather than padding itself with unrelated books, so that a recommendation always means something.
20. As a reader, I want the recommendations to be deterministic for the same set of likes, so that the section does not reshuffle for no reason between visits.
21. As a reader on a phone, I want the recommendations section and its like controls to lay out and work the same as the rest of the responsive UI, so that the feature is usable on any screen.
22. As a keyboard user, I want to move to and operate the like control without a mouse, so that the feature is accessible.
23. As a screen-reader user, I want the like control to announce its label and pressed/unpressed state, so that I know whether a book is liked.
24. As a reader who prefers reduced motion, I want recommended book cards to respect that preference the same way the main grid does, so that the feature does not introduce unwanted animation.
25. As a reader returning with corrupted or cleared local storage, I want the app to behave as if I have liked nothing rather than break, so that a storage problem never takes the page down.
26. As a maintainer, I want the recommendation logic to be a single pure function I can test in isolation, so that I can change the scoring rules with confidence.
27. As a maintainer, I want to tune how strongly author overlap and category overlap count without rewriting the function, so that the ranking can be adjusted from experience.
28. As a maintainer, I want adding or removing books from `books-data.js` to require no change to the recommendation logic, so that the data stays decoupled from behaviour as it is today.

## Implementation Decisions

### Modules

- **New: recommendation engine module.** A standalone file exporting a single pure
  function. It imports nothing — the caller passes the book data in. No DOM access, no
  `localStorage` access, no `Date`/`Math.random`. This is the one tested seam.
- **New: liked-books store.** A thin wrapper over `localStorage` that reads and writes
  the set of liked book ids and exposes add / remove / toggle / has / read-all. Kept
  small enough not to warrant its own tests; a bad or missing stored value is treated as
  "no likes". Reuses the existing persistence convention (a single `localStorage` key,
  as with `bookshelf-theme`).
- **Modified: `script.js`.** Becomes a module script (`<script type="module">` in
  `index.html`) so it can import the engine and the store. Gains: wiring the like control
  on book cards and in the modal, rendering the "Recommended for you" section, and
  recomputing + re-rendering that section whenever a like changes. Reuses the existing
  `createBookCard` for recommended books so they look and behave like every other card
  (including opening the modal).
- **Modified: `index.html`.** Adds the "Recommended for you" section container on the
  home view, placed between the hero and the main books grid. Switches the app script
  tag to `type="module"`.
- **Modified: `style.css`.** Styles for the recommendations section and the like control,
  built on the existing design tokens and responsive patterns.
- **`books-data.js`.** May stay a global-assigning classic script or gain an `export`;
  either is acceptable. The engine never reads it directly — data is always passed as an
  argument.

### Recommendation function contract

- Signature shape (from the seam discussion, not a code mandate):
  `recommendBooks(books, likedIds, { limit }) -> Book[]`
  - `books` — the full collection, array of book records as in `books-data.js`.
  - `likedIds` — the reader's liked book ids (array or Set).
  - `limit` — maximum number of recommendations to return; defaults to a small number
    (4) when omitted.
- Returns book records drawn from `books`, ordered best first.
- **Excludes** every book whose id is in `likedIds`.
- **Scoring** for each remaining candidate: a weighted sum of
  - the number of liked books sharing the candidate's `author`, times an author weight,
  - plus the number of liked books sharing the candidate's `category`, times a category
    weight,
  with the author weight strictly greater than the category weight, so an author match
  outranks a category-only match. The weights are named constants in the module, tunable
  without changing the logic. Author and category comparisons are exact-string matches
  (the data is already normalised); no fuzzy matching.
- **Zero-overlap candidates** (score of 0 — no shared author and no shared category) are
  dropped, never used as filler.
- **Ordering:** by score descending, then a deterministic tie-break on stable fields of
  the book record (e.g. newer `year` first, then lower `id`), so the same likes always
  produce the same list.
- **Empty result** when `likedIds` is empty, when every overlapping book is already
  liked, or when nothing overlaps. Fewer than `limit` results is normal and returned
  as-is.

### Liked-books store behaviour

- Persists an array of book ids as JSON under one new `localStorage` key.
- Read path tolerates missing key, non-JSON, and non-array values by returning an empty
  set; it never throws to callers.
- Toggling a like writes synchronously, then the caller triggers a recommendations
  refresh.

### Home-view section behaviour

- The "Recommended for you" section renders `recommendBooks(booksData, likedIds)` output
  using `createBookCard`.
- When the result is empty: the section is hidden, or shows a one-line prompt to like
  some books. It must not render an empty card grid.
- A like or unlike anywhere in the UI (main grid, modal, or the recommendations section
  itself) recomputes and re-renders the section immediately, with no page reload.
- Recommended cards open the detail modal on click, identical to grid cards.

### Like control

- A toggle button on each book card and in the detail modal, reflecting liked state
  visually and via `aria-pressed`, with an `aria-label`. Keyboard operable. Built on
  existing tokens and, for any transition, honouring `prefers-reduced-motion` as the
  rest of the app does.

## Testing Decisions

- **What a good test looks like here.** It exercises only the observable contract of the
  recommendation engine: given a `books` array and a set of `likedIds`, assert the
  identity and order of the returned books. Tests must not assert on the weight
  constants, on private helpers, or on any internal scoring number. Ranking rules are
  verified relatively — e.g. "an author match is ordered ahead of a category-only match",
  "a book overlapping two liked books is ordered ahead of one overlapping a single liked
  book" — so the weights stay tunable without breaking the suite. Fixture book arrays are
  defined inline in the test file, shaped like `books-data.js` records but trimmed to the
  fields the engine reads (`id`, `author`, `category`; `title`/`year` as needed for
  tie-break assertions).
- **Module under test.** The recommendation engine module only.
- **Cases to cover.** Empty `likedIds` returns empty; liked books are excluded from
  their own recommendations; zero-overlap books are never returned; author overlap
  outranks category-only overlap; multiple overlaps outrank a single overlap; results are
  capped at `limit`; fewer-than-`limit` overlapping books returns the short list;
  identical likes produce an identical, stably ordered list across calls.
- **Prior art.** None — the repo currently has no tests. This spec establishes the
  pattern: Node's built-in test runner (`node:test` + `node:assert`) in a single
  `*.test.js` file beside the engine module, run with `node --test`. No new runtime or
  dev dependencies, consistent with the project's zero-build, zero-dependency stance.
- **Not unit-tested.** The liked-books `localStorage` store (thin adapter) and the
  "Recommended for you" DOM rendering and like-control wiring — verified manually and by
  visual check, consistent with how search, filter, modal, and theming are handled today.

## Out of Scope

- Any external book API or larger catalog — recommendations run entirely off the bundled
  `books-data.js`.
- Similarity beyond exact author and exact category overlap: no description-text
  analysis, embeddings, tags, publication-year proximity, or fuzzy author matching.
- Collaborative filtering or any cross-user signal; there are no user accounts.
- Server-side or cross-device persistence and sync; likes live in one browser's
  `localStorage` only.
- A separate "my shelf" / "books I've added" concept distinct from liked books — liked is
  the only signal, and the app has no add-to-shelf feature today.
- Star ratings or any graded signal; a book is liked or it is not.
- "Not interested" / dismissing a specific recommendation, and per-recommendation
  "why you're seeing this" explanations.
- Pagination, "show more", or a dedicated recommendations page — the section is a small
  fixed-size list on the home view.
- Cold-start recommendations for readers who have liked nothing (popular picks, staff
  picks, etc.).

## Further Notes

- The genre field in the data is named `category`; this spec uses that term throughout to
  match `books-data.js`.
- Switching `script.js` to a module script is the one structural change the seam
  requires; it is a mechanical change and does not alter existing behaviour.
- A natural follow-up, explicitly out of scope now, is a short "because you liked
  <title>" line on each recommended card — the scoring already knows which liked books
  drove a match, so the information is available when it is wanted.
- Another likely follow-up is cold-start behaviour once there is appetite for it; the
  engine's empty-result contract leaves room for a caller-side fallback without changing
  the function.
