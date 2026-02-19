class FilterManager {
    constructor(state) {
        this.s = state;
    }

    // Normalize text: lowercase, strip punctuation, collapse spaces
    normalizeText(s) {
        if (!s) return '';
        return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Levenshtein distance for fuzzy single-word comparisons
    levenshtein(a, b) {
        if (a === b) return 0;
        const al = a.length, bl = b.length;
        if (al === 0) return bl;
        if (bl === 0) return al;
        const matrix = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
        for (let i = 0; i <= al; i++) matrix[i][0] = i;
        for (let j = 0; j <= bl; j++) matrix[0][j] = j;
        for (let i = 1; i <= al; i++) {
            for (let j = 1; j <= bl; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[al][bl];
    }

    // Break the query into tokens (whole query + individual words)
    expandQueryTerms(query) {
        if (!query) return [''];
        const q = this.normalizeText(query);
        const terms = new Set();
        if (q) terms.add(q);
        q.split(/\s+/).forEach(t => { if (t) terms.add(t); });
        return Array.from(terms);
    }

    // Fuzzy match: true if content (normalized tokens) matches term by substring
    // or token-level one-edit distance (Levenshtein <= 1) or token contains term.
    fuzzyTermMatch(contentTokens, term) {
        if (!term) return true;
        const t = this.normalizeText(term);
        if (!t) return true;
        const joined = contentTokens.join(' ');
        if (joined.includes(t)) return true;
        // If the term is very short, try matching against initials/abbreviations
        if (t.length <= 3) {
            const abbrs = new Set();
            const len = contentTokens.length;
            for (let w = 1; w <= Math.min(4, len); w++) {
                for (let start = 0; start + w <= len; start++) {
                    const slice = contentTokens.slice(start, start + w);
                    const ab = slice.map(s => s.charAt(0)).join('');
                    if (ab) abbrs.add(ab);
                }
            }
            for (const a of abbrs) {
                if (a === t) return true;
                if (this.levenshtein(a, t) <= 1) return true;
            }
                // If the term is very short (1-2 chars), only match by exact token or initials
                if (t.length <= 2) {
                    // exact token match
                    for (const ct of contentTokens) if (ct === t) return true;
                    // sliding-window initials (e.g., 'vs' -> 'visual studio')
                    const abbrs = new Set();
                    const len = contentTokens.length;
                    for (let w = 1; w <= Math.min(3, len); w++) {
                        for (let start = 0; start + w <= len; start++) {
                            const slice = contentTokens.slice(start, start + w);
                            const ab = slice.map(s => s.charAt(0)).join('');
                            if (ab) abbrs.add(ab);
                        }
                    }
                    for (const a of abbrs) if (a === t) return true;
                    return false;
                }

                // For longer terms, require each token in the query to match some content token.
                const termTokens = t.split(/\s+/);
                for (const tt of termTokens) {
                    let matched = false;
                    for (const ct of contentTokens) {
                        if (!ct) continue;
                        if (ct.includes(tt)) { matched = true; break; }
                        // allow small typo tolerance only for tokens length >= 3
                        if (tt.length >= 3 && Math.abs(ct.length - tt.length) <= 1 && this.levenshtein(ct, tt) <= 1) { matched = true; break; }
                    }
                    if (!matched) return false;
                }
                return true;
            s.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    filterCards() {
        const s = this.s;
        if (!s.portfolioGrid) return;
        const query = s.searchQuery.toLowerCase();
        const expanded = this.expandQueryTerms(query);
        let visibleCount = 0;
        s.portfolioGrid.querySelectorAll('.portfolio-card').forEach(card => {
            const cardType = card.getAttribute('data-type') || '';
            const cardTools = (card.getAttribute('data-tools') || '').toLowerCase();
            const toolsList = cardTools.split(',').map(t => t.trim());

            const matchesType = s.selectedCategories.includes('all') || s.selectedCategories.includes(cardType);
            const matchesTool = s.selectedTools.includes('all') || toolsList.some(t => s.selectedTools.map(st => st.toLowerCase()).includes(t));

            const contentRaw = (card.innerText || '') + ' ' + cardTools + ' ' + (card.getAttribute('data-info') || '');
            const content = this.normalizeText(contentRaw);
            const contentTokens = content.split(/\s+/);
            const matchesQuery = expanded.length === 0 || expanded.some(term => this.fuzzyTermMatch(contentTokens, term));

            if (matchesType && matchesTool && matchesQuery) {
                card.style.display = "block";
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });
        if (s.noResults) s.noResults.style.display = visibleCount === 0 ? "block" : "none";
    }

    filterSkills() {
        const s = this.s;
        if (!s.skillsList) return;
        const query = s.searchQuery.toLowerCase();
        const expanded = this.expandQueryTerms(query);
        let visibleCount = 0;
        s.skillsList.querySelectorAll('.skill-item').forEach(item => {
            const info = item.getAttribute('data-info') || '';
            const textRaw = (item.innerText || '') + ' ' + info;
            const text = this.normalizeText(textRaw);
            const textTokens = text.split(/\s+/).filter(t => t);
            const matchesQuery = expanded.length === 0 || expanded.some(term => this.fuzzyTermMatch(textTokens, term));
            const matchesType = s.selectedCategories.includes('all') || s.selectedCategories.includes(item.dataset.type);
            if (matchesQuery && matchesType) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        if (s.noResults) s.noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    sortSkills() {
        const s = this.s;
        if (!s.skillsList) return;
        const sortBy = s.selectedSort;
        const order = s.selectedOrder;
        const items = Array.from(s.skillsList.querySelectorAll('.skill-item'));
        items.sort((a, b) => {
            let valA, valB;
            const nameA = a.dataset.name.toLowerCase().trim();
            const nameB = b.dataset.name.toLowerCase().trim();
            if (sortBy === 'name') {
                valA = nameA; valB = nameB;
            } else if (sortBy === 'proficiency') {
                valA = Utils.getProficiencyValue(a.querySelector('.level').innerText);
                valB = Utils.getProficiencyValue(b.querySelector('.level').innerText);
            } else {
                valA = new Date(a.querySelector('.last-used').innerText).getTime() || 0;
                valB = new Date(b.querySelector('.last-used').innerText).getTime() || 0;
            }
            if (valA === valB) return nameA.localeCompare(nameB);
            return order === 'desc' ? (valA > valB ? -1 : 1) : (valA < valB ? -1 : 1);
        });
        items.forEach(item => s.skillsList.appendChild(item));
    }

    sortCards() {
        const s = this.s;
        if (!s.portfolioGrid) return;
        const sortBy = s.selectedSort;
        const order = s.selectedOrder;
        const cards = Array.from(s.portfolioGrid.querySelectorAll('.portfolio-card'));
        cards.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'name') {
                valA = a.getAttribute('data-name').toLowerCase();
                valB = b.getAttribute('data-name').toLowerCase();
            } else {
                valA = new Date(a.getAttribute('data-date').replace(/-/g, '\/')).getTime();
                valB = new Date(b.getAttribute('data-date').replace(/-/g, '\/')).getTime();
            }
            return order === 'asc' ? (valA - valB) : (valB - valA);
        });
        cards.forEach(card => s.portfolioGrid.appendChild(card));
    }
}
