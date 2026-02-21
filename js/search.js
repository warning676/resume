let globalSearchData = {
    videos: [],
    games: [],
    skills: [],
    achievements: []
};

function initializeGlobalSearch() {
    const searchBtn = document.getElementById('global-search-btn');
    const searchModal = document.getElementById('global-search-modal');
    const searchInput = document.getElementById('global-search-input');
    
    if (!searchBtn || !searchModal || !searchInput) {
        return;
    }
    
    const searchCloseBtn = searchModal.querySelector('.search-close-btn');
    const searchResults = document.getElementById('search-results');
    
    if (searchBtn.dataset.initialized) {
        return;
    }
    searchBtn.dataset.initialized = 'true';

    searchBtn.addEventListener('click', () => {
        openGlobalSearch();
    });

    searchCloseBtn.addEventListener('click', () => {
        closeGlobalSearch();
    });

    let searchModalMousedownTarget = null;
    
    searchModal.addEventListener('mousedown', (e) => {
        searchModalMousedownTarget = e.target;
    });
    
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal && searchModalMousedownTarget === searchModal) {
            closeGlobalSearch();
        }
        searchModalMousedownTarget = null;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            closeGlobalSearch();
        }
    });

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 200);
    });
}

function openGlobalSearch() {
    const searchModal = document.getElementById('global-search-modal');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('search-results');
    
    searchModal.classList.add('active');
    searchInput.value = '';
    
    if (searchResults) {
        searchResults.innerHTML = '<div class="search-no-results"><div class="search-no-results-text">Start typing to search</div><div class="search-no-results-hint">Search across all projects, skills, and achievements</div></div>';
    }
    
    searchInput.focus();
    
    loadAllSearchData();
}

function closeGlobalSearch() {
    const searchModal = document.getElementById('global-search-modal');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('search-results');
    
    searchModal.classList.remove('active');
    
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
}

async function loadAllSearchData() {
    if (!window.dataService) return;
    
    if (globalSearchData.videos.length === 0) {
        const videosData = await window.dataService.loadSheet('videos');
        globalSearchData.videos = videosData.data || [];
        
        if (window.state && videosData.data) {
            window.state.filmFestivalAwards = window.dataService.buildFilmFestivalAwards(videosData.data);
        }
    }
    
    if (globalSearchData.games.length === 0) {
        const gamesData = await window.dataService.loadSheet('games');
        globalSearchData.games = gamesData.data || [];
    }
    
    if (globalSearchData.skills.length === 0) {
        const skillsData = await window.dataService.loadSheet('skills');
        globalSearchData.skills = skillsData.data || [];
    }
    
    if (globalSearchData.achievements.length === 0) {
        const achievementsData = await window.dataService.loadSheet('achievements');
        globalSearchData.achievements = achievementsData.data || [];
    }
}

function performSearch(query) {
    const searchResults = document.getElementById('search-results');
    
    if (!query || query.trim().length === 0) {
        searchResults.innerHTML = '<div class="search-no-results"><div class="search-no-results-text">Start typing to search</div><div class="search-no-results-hint">Search across all projects, skills, and achievements</div></div>';
        return;
    }
    
    searchResults.innerHTML = '<div class="search-no-results"><div class="search-no-results-text">Searching...</div></div>';

    const results = [];
    const queryLower = query.toLowerCase();

    globalSearchData.videos.forEach(item => {
        let score = getMatchScore(item, queryLower, ['name', 'info', 'badge']);
        
        if (window.state && window.state.filmFestivalAwards) {
            const awards = window.state.filmFestivalAwards[item.name];
            if (awards && awards.length > 0) {
                awards.forEach(award => {
                    const awardName = (award.award || '').toLowerCase();
                    const awardLocation = (award.location || '').toLowerCase();
                    
                    if (awardName === queryLower) {
                        score += 200;
                    }
                    else if (awardName.includes(queryLower) || queryLower.includes(awardName)) {
                        score += 150;
                    }
                    else {
                        const queryWords = queryLower.split(' ');
                        queryWords.forEach(word => {
                            if (word.length > 2 && awardName.includes(word)) {
                                score += 80;
                            }
                        });
                    }
                    
                    if (awardLocation.includes(queryLower)) {
                        score += 30;
                    }
                });
            }
        }
        
        if (score > 0) {
            results.push({
                type: 'video',
                data: item,
                score: score,
                route: '/videos'
            });
        }
    });

    globalSearchData.games.forEach(item => {
        const score = getMatchScore(item, queryLower, ['name', 'info', 'badge']);
        if (score > 0) {
            results.push({
                type: 'game',
                data: item,
                score: score,
                route: '/games'
            });
        }
    });

    globalSearchData.skills.forEach(item => {
        let score = getMatchScore(item, queryLower, ['name', 'badge']);
        
        if (item.certName) {
            const certNameLower = item.certName.toLowerCase();
            
            if (certNameLower === queryLower) {
                score += 200;
            }
            else if (certNameLower.includes(queryLower) || queryLower.includes(certNameLower)) {
                score += 150;
            }
            else {
                const queryWords = queryLower.split(' ');
                queryWords.forEach(word => {
                    if (word.length > 2 && certNameLower.includes(word)) {
                        score += 80;
                    }
                });
            }
        }
        
        if (item.certified && (queryLower.includes('certified') || queryLower.includes('certification'))) {
            score += 30;
        }
        
        if (score > 0) {
            results.push({
                type: 'skill',
                data: item,
                score: score,
                route: '/technical'
            });
        }
    });

    const videoNames = new Set(globalSearchData.videos.map(v => v.name));
    globalSearchData.achievements.forEach(item => {
        if (videoNames.has(item.name)) return;
        
        let score = getMatchScore(item, queryLower, ['name', 'info', 'badge', 'certName']);
        
        if (queryLower.includes('film festival') || queryLower.includes('festival') || 
            queryLower.includes('award') || queryLower.includes('won')) {
            score += 25;
        }
        
        if (score > 0) {
            results.push({
                type: 'achievement',
                data: item,
                score: score,
                route: '/achievements'
            });
        }
    });

    results.sort((a, b) => b.score - a.score);

    renderSearchResults(results, query);
}

function getMatchScore(item, queryLower, fields) {
    let score = 0;
    
    fields.forEach(field => {
        const value = (item[field] || '').toLowerCase();
        
        if (field === 'name') {
            if (value === queryLower) score += 100;
            else if (value.includes(queryLower)) score += 50;
        }
        
        if (value.includes(queryLower)) {
            score += 10;
            
            if (value.startsWith(queryLower)) score += 20;
        }
        
        const queryWords = queryLower.split(' ');
        queryWords.forEach(word => {
            if (word.length > 2 && value.includes(word)) {
                score += 5;
            }
        });
    });
    
    return score;
}

function renderSearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results"><div class="search-no-results-text">No results found</div><div class="search-no-results-hint">Try different keywords</div></div>';
        return;
    }
    
    let html = `<div style="padding: 10px 0 15px; color: #8b949e; font-size: 0.9rem;">
        Showing results for "<span style="color: #58a6ff;">${escapeHtml(query)}</span>" (${results.length} ${results.length === 1 ? 'result' : 'results'})
    </div>`;

    html += results.map(result => {
        const title = result.data.name || 'Untitled';
        const description = result.data.info || result.data.badge || '';
        const highlightedTitle = highlightMatch(title, query);
        const highlightedDesc = highlightMatch(description, query);
        
        const badges = [];
        
        const typeClass = `type-${result.type}`;
        let typeName = result.type.charAt(0).toUpperCase() + result.type.slice(1);
        if (result.type === 'achievement') {
            typeName = 'Won Awards';
        }
        badges.push(`<span class="search-result-type ${typeClass}">${typeName}</span>`);
        
        if (result.type === 'video' && window.dataService) {
            const state = window.state || {};
            const filmFestivalAwards = state.filmFestivalAwards || {};
            const awards = filmFestivalAwards[result.data.name];
            
            if (awards && awards.length > 0) {
                const awardsList = awards.map(a => `${a.award} - ${a.location}`).join('\n');
                badges.push(`<span class="search-result-type type-achievement" title="${awardsList}" style="cursor: help;">Won Awards</span>`);
            }
        }
        
        if (result.type === 'skill' && result.data.certified) {
            const certName = result.data.certName || result.data.name;
            badges.push(`<span class="search-result-type type-certified" title="${certName}" style="cursor: help;">Certified</span>`);
        }
        
        const badgesHtml = badges.join(' ');
        
        return `
            <div class="search-result-item" onclick="navigateToSearchResult('${result.route}', '${escapeHtml(title)}', '${result.type}')">
                <div class="search-result-header">
                    ${badgesHtml}
                </div>
                <div class="search-result-title">${highlightedTitle}</div>
                ${highlightedDesc ? `<div class="search-result-info">${highlightedDesc}</div>` : ''}
            </div>
        `;
    }).join('');

    searchResults.innerHTML = html;
}

function highlightMatch(text, query) {
    if (!text) return '';
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<span class="search-result-match">$1</span>');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
    return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

function navigateToSearchResult(route, title, type) {
    closeGlobalSearch();
    
    if (window.location.pathname !== route && !window.location.pathname.endsWith(route)) {
        navigateTo(route);
        
        waitForDataToLoad().then(() => {
            setTimeout(() => {
                openModalForSearchResult(title, type);
            }, 300);
        });
    } else {
        waitForDataToLoad().then(() => {
            openModalForSearchResult(title, type);
        });
    }
}

function waitForDataToLoad() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const hasPortfolioCards = document.querySelectorAll('.portfolio-card[data-name]').length > 0;
            const hasSkillItems = document.querySelectorAll('.skill-item[data-name]').length > 0;
            const notSkeletons = !document.querySelector('.skeleton-card, .skeleton-item');
            const hasSearchInput = document.getElementById('portfolio-search');
            
            if ((hasPortfolioCards || hasSkillItems || notSkeletons) && hasSearchInput) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 50);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 5000);
    });
}

function openModalForSearchResult(title, type) {
    const searchInput = document.getElementById('portfolio-search');
    
    if (searchInput && window.state) {
        searchInput.value = title;
        
        window.state.searchQuery = title;
        if (window.state.isSkillsPage) {
            window.state.filterSkills();
        } else {
            window.state.filterCards();
        }
        
        setTimeout(() => {
            const portfolioCard = document.querySelector(`.portfolio-card[data-name="${title}"]`);
            const skillItem = document.querySelector(`.skill-item[data-name="${title}"]`);
            
            const item = portfolioCard || skillItem;
            
            if (item && item.style.display !== 'none') {
                item.click();
            } else {
                const items = Array.from(document.querySelectorAll('.portfolio-card, .skill-item'));
                for (const card of items) {
                    if (card.style.display === 'none') continue;
                    const cardTitle = card.querySelector('.card-title, .skill-name, h3, h4')?.textContent.trim();
                    if (cardTitle === title) {
                        card.click();
                        break;
                    }
                }
            }
        }, 100);
    }
}
