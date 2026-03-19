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
            if (Number.isFinite(m) && Number.isFinite(y)) return new Date(y, m, 1).getTime() || 0;
        }

        const fallback = Date.parse(normalized);
        return Number.isFinite(fallback) ? fallback : 0;
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
