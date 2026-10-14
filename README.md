# NovaCalc — Smart Online Calculator

NovaCalc is a responsive browser calculator made with HTML, CSS and vanilla JavaScript. It is designed to be hosted as a static website on GitHub Pages.

## Included files

- `index.html` — page structure, display, keypad, history panel and quick tools
- `style.css` — responsive layout, dark/light themes, calculator key styles and mobile design
- `script.js` — arithmetic parser, calculation logic, keyboard shortcuts, history, theme switch and quick tools
- `README.md` — setup and publishing instructions

## Features

- Addition, subtraction, multiplication and division
- Decimal numbers, sign change, percent and backspace
- Clear all (AC) and equals
- Quick tools: square, square root, reciprocal and pi
- Calculation history for the current page session
- Keyboard support: number keys, `+`, `-`, `*`, `/`, `.`, `Enter`, `Backspace`, `Escape` and `%`
- Dark and light theme toggle
- Responsive for mobile, tablet and desktop
- Uses a small arithmetic parser rather than `eval()`
- No login, database, or backend required for the calculator features

## Publish on GitHub Pages

1. Download and extract the ZIP file.
2. Sign in to GitHub and create a new repository named `novacalc`.
3. Upload `index.html`, `style.css`, `script.js` and `README.md` directly into the repository's root (not inside another nested folder).
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch **main** and folder **/(root)**, then click **Save**.
7. Wait for the Pages status to show the published URL.

Your website URL will usually look like `https://YOUR-USERNAME.github.io/novacalc/`.

## Test locally

Open `index.html` in a modern browser. An internet connection is only needed to load the optional Google Fonts; the calculator itself works locally without a backend.

## Notes

- History lasts only while the page remains open; it is not stored permanently.
- This is a frontend calculator, so it does not need server-side code.
