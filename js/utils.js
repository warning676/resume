class Utils {
    static debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    static formatFullDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString.replace(/-/g, '\/'));
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    static getProficiencyValue(level) {
        const normalizedLevel = String(level || '').trim().toLowerCase();
        const scores = { advanced: 3, intermediate: 2, beginner: 1 };
        return scores[normalizedLevel] || 0;
    }

    static parseMonthYearToTime(input) {
        const raw = String(input || '').trim();
        if (!raw || raw === '-') return 0;
        const normalized = raw.replace(/\s+/g, ' ').trim();
        const yearOnly = normalized.match(/^(\d{4})$/);
        if (yearOnly) return new Date(Number.parseInt(yearOnly[1], 10), 0, 1).getTime() || 0;

        const monthMap = {
            jan: 0, january: 0,
            feb: 1, february: 1,
            mar: 2, march: 2,
            apr: 3, april: 3,
            may: 4,
            jun: 5, june: 5,
            jul: 6, july: 6,
            aug: 7, august: 7,
            sep: 8, sept: 8, september: 8,
            oct: 9, october: 9,
            nov: 10, november: 10,
            dec: 11, december: 11
        };

        const parts = normalized.toLowerCase().split(' ');
        if (parts.length >= 2) {
            const m = monthMap[parts[0]];
            const y = Number.parseInt(parts[1], 10);
            if (Number.isFinite(m) && Number.isFinite(y) && y >= 1970) return new Date(y, m, 1).getTime() || 0;
        }

        const fallback = Date.parse(normalized);
        return Number.isFinite(fallback) ? fallback : 0;
    }

    static parseMonthRangeYearEndMs(input) {
        const str = String(input || '');
        const match = str.match(/\b([A-Za-z]{3,9})\s*-\s*([A-Za-z]{3,9})\s+(\d{4})\b/);
        if (!match) return 0;
        const y = Number.parseInt(match[3], 10);
        const endTok = String(match[2] || '').toLowerCase().replace(/\./g, '').trim();
        const head = endTok.slice(0, 3);
        const monthEnd = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }[head];
        if (!Number.isFinite(y) || y < 1970 || y > 2100 || monthEnd === undefined) return 0;
        const lastDay = new Date(y, monthEnd + 1, 0, 23, 59, 59, 999).getTime();
        return Number.isFinite(lastDay) ? lastDay : 0;
    }

    static parseAcademicTermEndMs(input) {
        const s = String(input || '');
        const m = s.match(/\b(fall|autumn|spring|summer|winter)\s+(\d{4})\b/i);
        if (!m) return 0;
        const term = m[1].toLowerCase();
        const y = Number.parseInt(m[2], 10);
        if (!Number.isFinite(y) || y < 1970 || y > 2100) return 0;
        if (term === 'fall' || term === 'autumn') return new Date(y, 11, 31, 23, 59, 59, 999).getTime();
        if (term === 'spring') return new Date(y, 4, 31, 23, 59, 59, 999).getTime();
        if (term === 'summer') return new Date(y, 7, 31, 23, 59, 59, 999).getTime();
        if (term === 'winter') return new Date(y, 0, 31, 23, 59, 59, 999).getTime();
        return 0;
    }

    static parseFlexibleDateStringMs(raw) {
        if (raw == null || raw === '') return 0;
        const s = String(raw).trim();
        if (!s) return 0;
        const my = Utils.parseMonthYearToTime(s);
        if (my) return my;
        const termEnd = Utils.parseAcademicTermEndMs(s);
        if (termEnd) return termEnd;
        const rangeEnd = Utils.parseMonthRangeYearEndMs(s);
        if (rangeEnd) return rangeEnd;
        const t = new Date(s.replace(/-/g, '/')).getTime();
        return Number.isFinite(t) ? t : 0;
    }

    static parseAchievementRecencyMs(name, date) {
        let t = Utils.parseFlexibleDateStringMs(date);
        if (!t && name) t = Utils.parseFlexibleDateStringMs(name);
        return t;
    }

    static extractYouTubeID(input) {
        if (!input) return '';
        
        if (!/[:/\.]/.test(input)) return input.trim();
        
        const patterns = [
            /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) return match[1];
        }
        
        return input.trim();
    }

    static lucideTrophySvg(options = {}) {
        const size = Number(options.size) || 18;
        const cls = String(options.className || 'lucide lucide-trophy').replace(/"/g, '');
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
    }

    static lucideChevronRightSvg(options = {}) {
        const size = Number(options.size) || 16;
        const cls = String(options.className || 'lucide lucide-chevron-right').replace(/"/g, '');
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}"><path d="m9 18 6-6-6-6"/></svg>`;
    }

    static syncPageScrollLock(locked) {
        const body = document.body;
        const html = document.documentElement;
        if (!body || !html) return;

        if (locked) {
            body.style.setProperty('overflow', 'hidden', 'important');
            html.style.setProperty('overflow', 'hidden', 'important');
            body.classList.add('scroll-lock');
            html.classList.add('scroll-lock');
            body.classList.add('modal-open');
            return;
        }

        const modals = [
            { id: 'global-search-modal', check: (el) => el.classList.contains('active') },
            { id: 'infoModal', check: (el) => el.style.display === 'flex' },
            { id: 'secondaryModal', check: (el) => el.style.display === 'flex' },
            { id: 'courses-modal', check: (el) => el.style.display === 'flex' },
            { id: 'external-link-modal', check: (el) => el.classList.contains('active') || el.style.display === 'flex' }
        ];

        const anyOpen = modals.some(m => {
            const el = document.getElementById(m.id);
            return el && m.check(el);
        }) || !!document.querySelector('.custom-select-container.open, .multi-select-container.open, .column-filter-menu.open');

        if (anyOpen) return;

        body.style.removeProperty('overflow');
        html.style.removeProperty('overflow');
        body.classList.remove('scroll-lock');
        html.classList.remove('scroll-lock');
        body.classList.remove('modal-open');
    }
}
