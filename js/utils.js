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
