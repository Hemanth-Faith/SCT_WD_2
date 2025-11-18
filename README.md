# Stopwatch + Analog Clock

A small interactive web app that provides a high-precision stopwatch with lap tracking and an analog clock that can display different timezones.

Features
- Start / Pause / Reset stopwatch with precise timing using `performance.now()` and `requestAnimationFrame`.
- Record lap times with per-lap delta and best/worst indicators.
- Persistent laps via `localStorage` and export as CSV or JSON.
- Per-lap copy-to-clipboard button.
- Keyboard shortcuts: `Space` (Start/Pause), `L` (Lap), `R` (Reset), `C` (Clear laps), `E` (Export CSV).
- Responsive dark UI with a right-side analog clock; timezone selectable via dropdown.

Files
- `index.html` — main page and UI
- `style.css` — visual styling and responsive layout
- `script.js` — stopwatch logic, lap management, analog clock, timezone support

Usage
- Click `Start` (or press Space) to begin timing. Click `Lap` (or press `L`) to record a lap.
- `Reset` clears the stopwatch. `Clear Laps` removes recorded laps but preserves the stopwatch.
- `Export CSV` / `Export JSON` downloads recorded laps.
- Use the timezone dropdown beneath the analog clock to view clock time for various IANA timezones (or choose `System (Local)` to use your machine's local time).
- The analog clock includes a small digital readout below the select to verify the shown timezone time.

Notes
- The analog clock obtains hour/minute/second values via `Intl.DateTimeFormat` (with robust fallbacks) and uses local milliseconds so the second hand animates smoothly.
- If you need additional timezones in the dropdown or a searchable/timezone picker, let me know and I can add it.

Development
- The code is intentionally small and dependency-free (vanilla HTML/CSS/JS).
- To extend: consider persisting the selected timezone in `localStorage`, adding auto-resume of running stopwatch, or exporting lap data with custom formatting.

License
- MIT-style: feel free to reuse and modify for learning or demo purposes.

Enjoy — tell me if you want extra features or a packaged release (ZIP or Git repo).
