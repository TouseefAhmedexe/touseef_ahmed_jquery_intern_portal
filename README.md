# Intern Portal: Vanilla JavaScript and jQuery 4.0.0

A small internship portal written first in vanilla JavaScript (`index.html`), with selected
features rebuilt in jQuery 4.0.0 (`jquery.html`). Task 15 of my Bloomrix internship.
No framework is used. All assignment data is sample data, and the form has no server.

## Files
- `index.html` - the vanilla JavaScript version
- `jquery.html` - the jQuery 4.0.0 version
- `style.css` - shared styling
- `data/assignments.json` - sample assignment data
- `lib/jquery-4.0.0.min.js` - jQuery 4.0.0, kept locally
- `js/shared` - code used by both versions: data functions, debounce, storage and theme
- `js/vanilla` - fetch, DOM rendering and events written without a library
- `js/jquery/app.js` - the jQuery version of the selected features

## Features in both versions
Assignment list with status badges, per-card progress bars, inline description toggles ("Show more"),
search with debounce, status and category filters, a details dialog, an application form with validation
messages, and toast notifications. The vanilla version also has a navigation bar and a theme preference
saved in localStorage. The jQuery version reads and changes the same saved theme.

## Which jQuery features were used
- Document ready, selectors, text(), val(), attr(), prop(), data()
- addClass(), removeClass(), hasClass-style checks with is(), siblings(), find(), closest(),
  children(), first()
- on(), one(), delegated events, and the event object
- $.ajax() with done(), fail() and always()
- serializeArray() and each()
- fadeIn(), fadeOut(), delay(), slideToggle() and slideUp()
- Chaining

## Vanilla and jQuery side by side
| Job | Vanilla | jQuery 4.0.0 |
| --- | --- | --- |
| Select | getElementById, querySelector | $("#id"), $(".class") |
| Text | textContent | text() |
| Class | classList.add, remove | addClass, removeClass |
| Create | createElement, append | $("<div>").append() |
| Events | addEventListener | on() |
| Delegation | event.target.closest() | on("click", selector, fn) |
| Request | fetch and response.ok | $.ajax().done().fail().always() |
| Form data | new FormData(form) | serializeArray() |
| Animation | CSS transition and animation | fadeIn, slideToggle |

## Converted function
selectCard($card) in js/jquery/app.js was converted to selectCard(card) in
js/vanilla/migrated.js. addClass became classList.add. siblings(".card") became the other
children of the parent that match ".card". find() became querySelector() and text() became
textContent.

## Things I learned about jQuery
- $() on a missing element returns an empty set and does not fail, so I check its length.
- data() reads an attribute once and does not write it back, so I used attr() for the
  attribute that the CSS reads.
- Effects write inline styles. I used them only for the toasts and the slide effect.
- A 404 is a failure in $.ajax(), but fetch() still succeeds, so response.ok is checked.
- jQuery has no dialog methods, so the native element is used through get(0).
- Plain JavaScript is enough for new code. jQuery is useful when maintaining older code.

## DevTools Verification Checklist
- **Console Panel:** Verify no uncaught runtime errors exist on either `index.html` or `jquery.html`.
- **Network Panel:** Verify `data/assignments.json` loads cleanly (`200 OK`) and that `jquery-4.0.0.min.js` is loaded locally.
- **Application Panel -> Local Storage:** Check `bloomrix.portal.theme` value updates when toggling theme.
- **DOM Inspection:** Observe dynamic creation of cards, badges, and modal elements.

## How to run
Open the folder in Visual Studio Code and use Live Server. Modules and fetch do not work when
an HTML file is opened by double-clicking it.