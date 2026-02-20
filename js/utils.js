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
        const scores = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
        return scores[level] || 0;
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
}
