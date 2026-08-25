
# BookShelf: Your Personal Mini Library

A searchable, filterable personal book collection. Built with zero frameworks and zero build step: vanilla HTML, CSS and JavaScript, running entirely in the browser.

**Live demo:** [bookshelf-6wq.pages.dev](https://bookshelf-6wq.pages.dev)

## Why vanilla JS?

The goal was to prove that a genuinely polished, interactive UI (search, filtering, modals, theming, animation) doesn't require a framework. Every interaction here is built on plain DOM APIs, with the same discipline of separating data, rendering, and behaviour into distinct concerns that a framework would otherwise enforce.

## Architecture

bookshelf/
├── index.html # markup shell + inline anti-flash theme script
├── style.css # design tokens (CSS custom properties), layout, themes
├── script.js # rendering, search/filter, modal, theme toggle, form
├── books-data.js # book data, decoupled from all logic
├── favicon.svg
├── sitemap.xml
└── robots.txt

Data lives in its own file (`books-data.js`), completely separate from rendering logic. `script.js` never hardcodes book content; it only knows how to render whatever `books-data.js` provides, so updating the collection never touches application logic.


## Feature summary

| Area | Highlights |
|---|---|
| **Search & filter** | Live search by title/author (debounced), category dropdown, combined instantly with no page reload. |
| **Book covers** | Fetched live from the Open Library Covers API by ISBN, with a generated SVG fallback if a cover fails to load. No broken images. |
| **Detail modal** | Click any book for full details in an accessible dialog (`role="dialog"`, focus trap, focus restoration on close, closes on ESC/backdrop click). |
| **Theming** | Light/dark mode with `localStorage` persistence and a pre-paint inline script that prevents a flash of the wrong theme on load. |
| **Animations** | Scroll-triggered fade-in on book cards via `IntersectionObserver`, respecting `prefers-reduced-motion`. |
| **Book requests** | A real working contact form (Formspree) for visitors to request a title that isn't in the collection, with inline success/error states and no page reload. |

## Cross-cutting concerns

- **Accessibility:** semantic modal markup, keyboard-dismissible (ESC), focus management on open/close, `aria-label`s on interactive controls.
- **Performance:** lazy-loaded cover images, debounced search input, `IntersectionObserver` instead of scroll listeners.
- **Resilience:** cover-loading failures degrade gracefully to a placeholder instead of a broken image icon.

## Tech

HTML, CSS, JavaScript. No frameworks, no build tools, no dependencies beyond the Open Library Covers API and Formspree for form handling.

## Known limitations

The book collection is static (defined in `books-data.js`); there is no backend or database. By design, this is a front-end showcase, not a content management system.
