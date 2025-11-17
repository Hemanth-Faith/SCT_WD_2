// Elements
const timerDisplay = document.querySelector('.timer-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const lapBtn = document.getElementById('lap-btn');
const lapsContainer = document.getElementById('laps');
const clearLapsBtn = document.getElementById('clear-laps-btn');
const exportLapsBtn = document.getElementById('export-laps-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const bestLapEl = document.getElementById('best-lap');
const worstLapEl = document.getElementById('worst-lap');
const timezoneSelect = document.getElementById('timezone-select');
const tzDigital = document.getElementById('tz-digital');

// State
let running = false;
let startTime = 0; // timestamp when started most recently
let elapsed = 0; // accumulated ms when paused
let rafId = null;
let laps = []; // {num, totalMs, deltaMs}

function formatTime(ms) {
    const totalMs = Math.max(0, Math.floor(ms));
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const mmm = String(milliseconds).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${mmm}`;
}

function updateDisplay(nowMs) {
    const total = elapsed + (running ? (nowMs - startTime) : 0);
    timerDisplay.textContent = formatTime(total);
}

function rafLoop(ts) {
    updateDisplay(ts);
    rafId = requestAnimationFrame(rafLoop);
}

function startTimer() {
    if (running) return;
    running = true;
    startTime = performance.now();
    startPauseBtn.textContent = 'Pause';
    rafId = requestAnimationFrame(rafLoop);
}

function pauseTimer() {
    if (!running) return;
    running = false;
    elapsed += performance.now() - startTime;
    startTime = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    startPauseBtn.textContent = 'Start';
}

function toggleStartPause() {
    if (running) pauseTimer(); else startTimer();
}

function resetTimer() {
    pauseTimer();
    elapsed = 0;
    laps = [];
    renderLaps();
    updateLapStats();
    timerDisplay.textContent = '00:00:00.000';
}

function recordLap() {
    if (!running && elapsed === 0) return; // don't record when stopped at zero
    const total = elapsed + (running ? (performance.now() - startTime) : 0);
    const prevTotal = laps.length ? laps[laps.length - 1].totalMs : 0;
    const delta = total - prevTotal;
    const lap = { num: laps.length + 1, totalMs: Math.round(total), deltaMs: Math.round(delta) };
    laps.unshift(lap); // show newest first
    renderLaps();
    updateLapStats();
}

function renderLaps() {
    lapsContainer.innerHTML = '';
    if (!laps.length) return;
    // compute best/worst by delta
    let best = Infinity, worst = -Infinity;
    laps.forEach(l => {
        if (l.deltaMs < best) best = l.deltaMs;
        if (l.deltaMs > worst) worst = l.deltaMs;
    });

    for (const lap of laps) {
        const li = document.createElement('li');
        const left = document.createElement('div');
        left.className = 'lap-left';
        const number = document.createElement('div');
        number.className = 'lap-number';
        number.textContent = `Lap ${lap.num}`;
        const time = document.createElement('div');
        time.className = 'lap-time';
        time.textContent = formatTime(lap.totalMs);
        left.appendChild(number);
        left.appendChild(time);

        const delta = document.createElement('div');
        delta.className = 'lap-delta';
        const sign = laps.indexOf(lap) === laps.length - 1 ? '' : '+'; // oldest lap shows no + maybe
        delta.textContent = `${sign}${formatTime(lap.deltaMs)}`;

        if (lap.deltaMs === best) li.classList.add('best');
        if (lap.deltaMs === worst) li.classList.add('worst');

        // actions: copy button
        const actions = document.createElement('div');
        actions.className = 'lap-item-actions';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.title = 'Copy lap time to clipboard';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(formatTime(lap.totalMs));
            copyBtn.textContent = 'Copied';
            setTimeout(() => (copyBtn.textContent = 'Copy'), 900);
        });

        actions.appendChild(delta);
        actions.appendChild(copyBtn);

        li.appendChild(left);
        li.appendChild(actions);
        lapsContainer.appendChild(li);
    }
}

function updateLapStats() {
    if (!laps.length) {
        bestLapEl.textContent = 'Best: —';
        worstLapEl.textContent = 'Worst: —';
        return;
    }
    let min = Infinity, max = -Infinity;
    let minIdx = -1, maxIdx = -1;
    for (let i = 0; i < laps.length; i++) {
        const d = laps[i].deltaMs;
        if (d < min) { min = d; minIdx = i; }
        if (d > max) { max = d; maxIdx = i; }
    }
    bestLapEl.textContent = `Best: ${formatTime(min)}`;
    worstLapEl.textContent = `Worst: ${formatTime(max)}`;
}

function clearLaps() {
    laps = [];
    renderLaps();
    updateLapStats();
}

function exportLapsCSV() {
    if (!laps.length) return;
    const header = ['Lap Number','Total Time','Lap Time (delta ms)'];
    const rows = laps.slice().reverse().map(l => [l.num, formatTime(l.totalMs), l.deltaMs]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laps_${new Date().toISOString().replace(/[:.]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportLapsJSON() {
    if (!laps.length) return;
    const obj = {
        generatedAt: new Date().toISOString(),
        laps: laps.slice().reverse().map(l => ({ number: l.num, total: formatTime(l.totalMs), deltaMs: l.deltaMs }))
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laps_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(() => {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        return Promise.resolve();
    }
}

// persist/load state
const STORAGE_KEY = 'stopwatch_state_v1';
function saveState() {
    const state = { elapsed, laps };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.laps)) {
            // ensure numeric values
            laps = s.laps.map(l => ({ num: l.num, totalMs: l.totalMs || l.total || 0, deltaMs: l.deltaMs }));
        }
        if (s && typeof s.elapsed === 'number') elapsed = s.elapsed;
    } catch (e) { /* ignore */ }
}

// wire additional listeners
exportJsonBtn.addEventListener('click', exportLapsJSON);

// save on changes
const saveTrigger = () => saveState();

// wrap functions that modify laps/elapsed to call saveState
const origRecordLap = recordLap;
recordLap = function() { origRecordLap(); saveTrigger(); };
const origClearLaps = clearLaps;
clearLaps = function() { origClearLaps(); saveTrigger(); };
const origResetTimer = resetTimer;
resetTimer = function() { origResetTimer(); saveTrigger(); };

// Initialize from storage
loadState();
renderLaps();
updateLapStats();
updateDisplay(performance.now());

// Analog clock
const canvas = document.getElementById('analog-clock');
const ctx = canvas.getContext('2d');
let clockRaf = null;

function drawClock() {
    // obtain time for selected timezone (hours/minutes/seconds/ms)
    const tz = timezoneSelect ? timezoneSelect.value : 'system';
    const t = getZonedTime(tz);
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 8;

    ctx.clearRect(0,0,w,h);
    // face
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fill();

    // ticks
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const inner = radius - (i % 5 === 0 ? 14 : 8);
        const outer = radius - 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = (i % 5 === 0) ? 2.2 : 1;
        ctx.stroke();
    }

    // hands
    const sec = t.seconds + t.ms / 1000;
    const min = t.minutes + sec / 60;
    const hr = (t.hours % 12) + min / 60;

    // hour
    ctx.beginPath();
    const hourAngle = (hr / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.rotate(hourAngle);
    ctx.moveTo(-6, 0);
    ctx.lineTo(radius * 0.5, 0);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
    ctx.rotate(-hourAngle);

    // minute
    ctx.beginPath();
    const minAngle = (min / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.rotate(minAngle);
    ctx.moveTo(-6, 0);
    ctx.lineTo(radius * 0.72, 0);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.stroke();
    ctx.rotate(-minAngle);

    // second
    ctx.beginPath();
    const secAngle = (sec / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.rotate(secAngle);
    ctx.moveTo(-10, 0);
    ctx.lineTo(radius * 0.88, 0);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(124,58,237,0.95)';
    ctx.stroke();
    ctx.rotate(-secAngle);

    // center cap
    ctx.beginPath();
    ctx.arc(0,0,4,0,Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();

    ctx.restore();

    // update digital timezone readout for visibility
    if (tzDigital) {
        const display = `${String(t.hours).padStart(2,'0')}:${String(t.minutes).padStart(2,'0')}:${String(t.seconds).padStart(2,'0')}`;
        tzDigital.textContent = display + (timezoneSelect && timezoneSelect.value && timezoneSelect.value !== 'system' ? `  ${timezoneSelect.value}` : '  (Local)');
    }
}

function clockLoop() {
    drawClock();
    clockRaf = requestAnimationFrame(clockLoop);
}

function startClock() {
    if (clockRaf) return;
    clockRaf = requestAnimationFrame(clockLoop);
}

function stopClock() {
    if (clockRaf) cancelAnimationFrame(clockRaf);
    clockRaf = null;
}

// adjust devicePixelRatio for crisp canvas
function resizeCanvasToDisplaySize(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth * ratio;
    const h = canvas.clientHeight * ratio;
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        return true;
    }
    return false;
}

// Get time parts (hours, minutes, seconds, ms) for a given IANA timezone or 'system'
function getZonedTime(timeZone) {
    const now = new Date();
    if (!timeZone || timeZone === 'system') {
        return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), ms: now.getMilliseconds() };
    }
    try {
        // Preferred: use formatToParts when available
        if (Intl && Intl.DateTimeFormat && Intl.DateTimeFormat.prototype.formatToParts) {
            const fmt = new Intl.DateTimeFormat('en-US', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const parts = fmt.formatToParts(now);
            const hourPart = parts.find(p => p.type === 'hour');
            const minutePart = parts.find(p => p.type === 'minute');
            const secondPart = parts.find(p => p.type === 'second');
            if (hourPart && minutePart && secondPart) {
                const hour = parseInt(hourPart.value, 10);
                const minute = parseInt(minutePart.value, 10);
                const second = parseInt(secondPart.value, 10);
                return { hours: hour, minutes: minute, seconds: second, ms: now.getMilliseconds() };
            }
        }
        // Fallback: use a locale that outputs ISO-like date/time (sv-SE) and parse it
        const s = now.toLocaleString('sv-SE', { timeZone }); // produces `YYYY-MM-DD HH:MM:SS`
        const [datePart, timePart] = s.split(' ');
        if (timePart) {
            const [hh, mm, ss] = timePart.split(':');
            return { hours: parseInt(hh, 10), minutes: parseInt(mm, 10), seconds: parseInt(ss, 10), ms: now.getMilliseconds() };
        }
        // as a last resort, fall back to system time
        console.warn('Could not parse timezone', timeZone, 'falling back to system time');
        return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), ms: now.getMilliseconds() };
    } catch (e) {
        console.warn('Timezone parsing error', e);
        return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), ms: now.getMilliseconds() };
    }
}

// update clock when timezone changes
if (timezoneSelect) {
    timezoneSelect.addEventListener('change', () => {
        initClock();
        // force a single redraw
        drawClock();
    });
}

function initClock() {
    // ensure canvas size matches CSS and scale for full-screen layout
    const container = canvas.parentElement;
    // pick a size that fits the container but also respects viewport height
    const maxByWidth = Math.max(120, container.clientWidth - 24);
    const maxByHeight = Math.max(120, Math.floor(window.innerHeight * 0.6));
    const size = Math.min(420, maxByWidth, maxByHeight);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    resizeCanvasToDisplaySize(canvas);
    startClock();
}

window.addEventListener('resize', () => {
    initClock();
});

initClock();

// Event listeners
startPauseBtn.addEventListener('click', toggleStartPause);
resetBtn.addEventListener('click', resetTimer);
lapBtn.addEventListener('click', recordLap);
clearLapsBtn.addEventListener('click', clearLaps);
exportLapsBtn.addEventListener('click', exportLapsCSV);

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleStartPause();
    } else if (e.key === 'l' || e.key === 'L') {
        recordLap();
    } else if (e.key === 'r' || e.key === 'R') {
        resetTimer();
    } else if (e.key === 'c' || e.key === 'C') {
        clearLaps();
    } else if (e.key === 'e' || e.key === 'E') {
        exportLapsCSV();
    }
});

// Initialize display
timerDisplay.textContent = '00:00:00.000';
