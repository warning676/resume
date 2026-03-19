let globalSearchData = {
    videos: [],
    games: [],
    skills: [],
    achievements: [],
    activities: [],
    courses: []
};

let globalSearchDataLoadPromise = null;
let globalSearchRequestId = 0;
let globalSearchLatestQuery = '';
let renderedSearchResults = [];
const searchModalFadeMs = 180;

function initializeGlobalSearch() {
    const searchBtn = document.getElementById('global-search-btn');
    const searchModal = document.getElementById('global-search-modal');
    const searchInput = document.getElementById('global-search-input');
    
    if (!searchBtn || !searchModal || !searchInput) {
        return;
    }
    
    const searchCloseBtn = searchModal.querySelector('.search-close-btn');
    const searchResults = document.getElementById('search-results');
    const searchClearBtn = document.getElementById('global-search-clear');
    
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

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchClearBtn.classList.remove('visible');
            searchInput.focus();
            performSearch('');
        });
    }

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
    searchInput.addEventListener('input', async (e) => {
        if (searchClearBtn) {
            searchClearBtn.classList.toggle('visible', e.target.value.length > 0);
        }
        globalSearchLatestQuery = e.target.value;
        const requestId = ++globalSearchRequestId;

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const query = globalSearchLatestQuery;
            if (!query || query.trim().length === 0) {
                performSearch(query);
                return;
            }

            renderSearchLoadingState(query);

            try {
                await ensureGlobalSearchDataLoaded();

                if (requestId !== globalSearchRequestId) {
                    return;
                }

                const currentQuery = searchInput.value;
                performSearch(currentQuery);
            } catch (err) {
                if (requestId !== globalSearchRequestId) {
                    return;
                }

                const searchResults = document.getElementById('search-results');
                if (searchResults) {
                    searchResults.innerHTML = '<div class="search-no-results"><div class="search-no-results-text">Search is temporarily unavailable</div><div class="search-no-results-hint">Please try again in a moment</div></div>';
                }
            }
        }, 200);
    });
}

function openGlobalSearch() {
    const searchModal = document.getElementById('global-search-modal');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchModal) return;

    if (searchModal._fadeTimer) {
        clearTimeout(searchModal._fadeTimer);
        searchModal._fadeTimer = null;
    }

    searchModal.classList.add('active');
    searchModal.style.transition = `opacity ${searchModalFadeMs}ms ease`;
    searchModal.style.opacity = '0';
    requestAnimationFrame(() => {
        searchModal.style.opacity = '1';
    });
    Utils.syncPageScrollLock(true);
    searchInput.value = '';
    
    const searchClearBtn = document.getElementById('global-search-clear');
    if (searchClearBtn) searchClearBtn.classList.remove('visible');
    
    if (searchResults) {
        searchResults.innerHTML = '<div class="search-no-results"><div class="search-no-results-text">Start typing to search</div><div class="search-no-results-hint">Search across all projects, skills, achievements, activities, and courses</div></div>';
    }
    
    searchInput.focus();
    
    ensureGlobalSearchDataLoaded();
}

function closeGlobalSearch() {
    const searchModal = document.getElementById('global-search-modal');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchModal) return;

    if (searchModal._fadeTimer) {
        clearTimeout(searchModal._fadeTimer);
        searchModal._fadeTimer = null;
    }

    if (!searchModal.classList.contains('active')) {
        searchModal.style.opacity = '';
        Utils.syncPageScrollLock(false);
    } else {
        searchModal.style.transition = `opacity ${searchModalFadeMs}ms ease`;
        searchModal.style.opacity = '0';
        searchModal._fadeTimer = setTimeout(() => {
            searchModal.classList.remove('active');
            searchModal.style.opacity = '';
            searchModal._fadeTimer = null;
            Utils.syncPageScrollLock(false);
        }, searchModalFadeMs + 20);
    }
    
    if (searchInput) searchInput.value = '';
    const searchClearBtn = document.getElementById('global-search-clear');
    if (searchClearBtn) searchClearBtn.classList.remove('visible');
    if (searchResults) searchResults.innerHTML = '';
}

async function loadAllSearchData() {
    if (!window.dataService) return;

    const loadSheetSafe = async (sheetName, targetKey) => {
        if (globalSearchData[targetKey].length > 0) return;
        try {
            const result = await window.dataService.loadSheet(sheetName);
            globalSearchData[targetKey] = result.data || [];
            if (targetKey === 'videos' && window.state && result.data) {
                window.state.filmFestivalAwards = window.dataService.buildFilmFestivalAwards(result.data);
            }
        } catch (err) {
            globalSearchData[targetKey] = [];
        }
    };

    await Promise.all([
        loadSheetSafe('videos', 'videos'),
        loadSheetSafe('games', 'games'),
        loadSheetSafe('skills', 'skills'),
        loadSheetSafe('Achievements', 'achievements'),
        loadSheetSafe('Activities', 'activities'),
        loadSheetSafe('Courses', 'courses')
    ]);
}

function ensureGlobalSearchDataLoaded() {
    if (globalSearchDataLoadPromise) {
        return globalSearchDataLoadPromise;
    }

    globalSearchDataLoadPromise = loadAllSearchData().catch((err) => {
        globalSearchDataLoadPromise = null;
        throw err;
    });

    return globalSearchDataLoadPromise;
}

function renderSearchLoadingState(query) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    const safeQuery = escapeHtml(query || '');
    searchResults.innerHTML = `
        <div class="search-loading-state" aria-live="polite" aria-busy="true">
            <div class="search-loading-head">
                <span class="search-loading-spinner" aria-hidden="true"></span>
                <span class="search-loading-text">Loading results for "<span class="search-loading-query">${safeQuery}</span>"</span>
            </div>
        </div>
    `;
}

function performSearch(query) {
    const searchResults = document.getElementById('search-results');
    
    if (!query || query.trim().length === 0) {
        searchResults.innerHTML = `
            <div class="page-search-status" style="visibility: hidden;">&nbsp;</div>
            <div class="search-no-results">
                <div class="search-no-results-text">Start typing to search</div>
                <div class="search-no-results-hint">Search across all projects, skills, achievements, activities, and courses</div>
            </div>`;
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
    const skillNames = new Set(globalSearchData.skills.map(s => s.name));
    globalSearchData.achievements.forEach(item => {
        if (videoNames.has(item.name)) return;
        if (skillNames.has(item.name)) return;
        
        let score = getMatchScore(item, queryLower, ['name', 'info', 'badge', 'certName', 'type', 'school', 'link']);
        score += getLinkMatchScore(item, queryLower, ['link', 'url']);
        
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

    globalSearchData.activities.forEach(item => {
        let score = getMatchScore(item, queryLower, ['name', 'school', 'type', 'description', 'status', 'role']);
        score += getLinkMatchScore(item, queryLower, ['link']);

        if (queryLower.includes('activity') || queryLower.includes('club') || queryLower.includes('participat')) {
            score += 15;
        }

        if (score > 0) {
            results.push({
                type: 'activity',
                data: item,
                score: score,
                route: '/activities'
            });
        }
    });

    globalSearchData.courses.forEach(item => {
        let score = getMatchScore(item, queryLower, ['id', 'name', 'school', 'type', 'status', 'grade', 'creditsearned', 'info']);
        if (queryLower.includes('course') || queryLower.includes('class') || queryLower.includes('credits')) {
            score += 12;
        }
        if (score > 0) {
            results.push({
                type: 'course',
                data: item,
                score: score,
                route: '/courses'
            });
        }
    });

    results.sort((a, b) => b.score - a.score);

    renderSearchResults(results, query);
}

function getMatchScore(item, queryLower, fields) {
    let score = 0;
    
    fields.forEach(field => {
        const value = String(item[field] ?? '').toLowerCase();
        
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

function getLinkMatchScore(item, queryLower, fields) {
    let score = 0;

    fields.forEach(field => {
        const rawValue = String(item[field] || '').trim();
        if (!rawValue) return;

        const candidates = [rawValue];

        try {
            const parsed = new URL(rawValue);
            const host = parsed.hostname.replace(/^www\./i, '');
            const path = decodeURIComponent(parsed.pathname || '').replace(/[\/_-]+/g, ' ');
            const params = decodeURIComponent(parsed.search || '').replace(/[?&=_+/.-]+/g, ' ');
            const hash = decodeURIComponent(parsed.hash || '').replace(/[#/_-]+/g, ' ');
            candidates.push(host, path, params, hash);
        } catch (err) {
            try {
                candidates.push(decodeURIComponent(rawValue));
            } catch (decodeErr) {
            }
        }

        const merged = candidates.join(' ').toLowerCase();
        if (!merged) return;

        if (merged === queryLower) score += 80;
        else if (merged.includes(queryLower)) score += 40;

        const queryWords = queryLower.split(' ');
        queryWords.forEach(word => {
            if (word.length > 2 && merged.includes(word)) {
                score += 8;
            }
        });
    });

    return score;
}

function resolveSearchMediaPath(path) {
    if (!path) return '';

    if (window.state && window.state.renderer && typeof window.state.renderer.fixImagePath === 'function') {
        return window.state.renderer.fixImagePath(path);
    }

    if (path.startsWith('http') || path.startsWith('data:')) {
        return path;
    }

    if (path.startsWith('../')) {
        return encodeURI(path);
    }

    return '../' + encodeURI(path);
}

function resolveSearchResultThumbnail(result) {
    if (!result || !result.data) return '';

    const item = result.data;

    if (result.type === 'video' || result.type === 'game') {
        const youtubeID = typeof Utils !== 'undefined' && Utils.extractYouTubeID
            ? Utils.extractYouTubeID(item.youtube || '')
            : '';
        const hasValidYoutube = youtubeID && youtubeID.trim() !== '' && youtubeID !== 'YOUTUBE_ID_HERE';

        if (hasValidYoutube) {
            return `https://i.ytimg.com/vi/${youtubeID}/mqdefault.jpg`;
        }

        if (Array.isArray(item.gallery) && item.gallery.length > 0) {
            return resolveSearchMediaPath(item.gallery[0]);
        }

        if (typeof item.gallery === 'string' && item.gallery.trim()) {
            const parts = item.gallery.split(',').map(g => g.trim()).filter(Boolean);
            if (parts.length > 0) {
                return resolveSearchMediaPath(parts[0]);
            }
        }
    }

    if (result.type === 'skill') {
        if (item.resolvedIcon) {
            return item.resolvedIcon;
        }

        if (item.icon) {
            return resolveSearchMediaPath(item.icon);
        }
    }

    return '';
}

function getSearchResultDescription(result) {
    if (!result || !result.data) return '';

    if (result.type === 'activity') {
        const parts = [];
        const schoolValue = String(result.data.school || '').trim();
        const startValue = String(result.data.startdate || result.data.started || '').trim();
        const endValue = String(result.data.enddate || result.data.ended || '').trim();
        if (schoolValue) parts.push(schoolValue);
        if (startValue && endValue) parts.push(`${startValue} - ${endValue}`);
        else if (startValue) parts.push(`${startValue} - Present`);
        return parts.length > 0 ? parts.join('\n') : String(result.data.description || '').trim();
    }

    if (result.type === 'course') {
        const id = String(result.data.id || result.data.courseid || '').trim();
        const school = String(result.data.school || '').trim();
        const parts = [];
        if (id) parts.push(id);
        if (school) parts.push(school);
        return parts.join('\n');
    }

    if (result.type !== 'achievement') {
        return result.data.info || result.data.badge || '';
    }

    const parts = [];
    const schoolValue = String(result.data.school || '').trim();
    const dateValue = String(result.data.date || '').trim();
    const infoValue = String(result.data.info || '').trim();

    if (schoolValue) parts.push(schoolValue);
    if (dateValue) parts.push(dateValue);
    if (infoValue) parts.push(infoValue);

    if (parts.length > 0) return parts.join('\n');
    return result.data.info || result.data.badge || '';
}

function renderSearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    renderedSearchResults = results;
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="page-search-status visible">
                Showing 0 results for "<span style="color: #58a6ff;">${escapeHtml(query)}</span>"
            </div>
            <div class="search-no-results">
                <div class="search-no-results-text">No results found</div>
                <div class="search-no-results-hint">Try different keywords</div>
            </div>`;
        return;
    }
    
    let html = `
        <div class="page-search-status visible">
            Showing results for "<span style="color: #58a6ff;">${escapeHtml(query)}</span>" (${results.length} ${results.length === 1 ? 'result' : 'results'})
        </div>`;

    html += results.map((result, index) => {
        const rawTitle = result.data.name || 'Untitled';
        const achievementCategory = String(result.data.type || '').trim();
        const title = result.type === 'achievement' && achievementCategory
            ? `${achievementCategory}: ${rawTitle}`.trim()
            : rawTitle;
        const description = getSearchResultDescription(result);
        const highlightedTitle = highlightMatch(title, query);
        const highlightedDesc = highlightMatch(description, query);
        const thumbnailUrl = resolveSearchResultThumbnail(result);
        const mediaClass = result.type === 'skill' ? 'is-skill' : 'is-wide';
        
        const badges = [];
        
        const typeClass = `type-${result.type}`;
        let typeName = result.type.charAt(0).toUpperCase() + result.type.slice(1);
        if (result.type === 'achievement') {
            typeName = 'Achievement';
        } else if (result.type === 'activity') {
            typeName = 'Activity';
        } else if (result.type === 'course') {
            typeName = 'Course';
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
        const mediaHtml = thumbnailUrl
            ? `<div class="search-result-media ${mediaClass}"><img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(title)} thumbnail" loading="lazy"></div>`
            : '';
        
        return `
            <div class="search-result-item" onclick="navigateToSearchResultByIndex(${index})">
                <div class="search-result-main${thumbnailUrl ? ' has-media' : ''}">
                    ${mediaHtml}
                    <div class="search-result-body">
                        <div class="search-result-header">
                            ${badgesHtml}
                        </div>
                        <div class="search-result-title">${highlightedTitle}</div>
                        ${highlightedDesc ? `<div class="search-result-info" style="white-space: pre-line;">${highlightedDesc}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    searchResults.innerHTML = html;
}

function getAchievementLink(item) {
    if (!item) return '';
    const rawLink = String(item.link || item.url || '').trim();
    if (!rawLink) return '';
    try {
        const parsed = new URL(rawLink, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (err) {
    }
    return '';
}

function getActivityLink(item) {
    if (!item) return '';
    const rawLink = String(item.link || item.url || '').trim();
    if (!rawLink) return '';
    try {
        const parsed = new URL(rawLink, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (err) {
    }
    return '';
}

function normalizeAchievementText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function findAchievementEntryElement(title, options = {}) {
    const normalizedTitle = normalizeAchievementText(title);
    if (!normalizedTitle) return null;

    const { preferLink = false } = options;
    const linkSelectors = [
        '#presidents-list-items a',
        '#honor-roll-items a',
        '#nominations-items a'
    ];
    const textSelectors = [
        '#presidents-list-items span',
        '#honor-roll-items span',
        '#nominations-items span'
    ];

    const selectors = preferLink
        ? [...linkSelectors, ...textSelectors]
        : [...linkSelectors, ...textSelectors];

    const candidates = Array.from(document.querySelectorAll(selectors.join(', ')));
    return candidates.find((el) => {
        if (preferLink && el.tagName !== 'A') return false;
        const text = normalizeAchievementText(el.textContent || '');
        if (!text || text === 'no entries yet') return false;
        return text === normalizedTitle || text.includes(normalizedTitle) || normalizedTitle.includes(text);
    }) || null;
}

function scrollToAchievementEntry(title) {
    const target = findAchievementEntryElement(title);
    if (!target) return false;
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    return true;
}

function centerAndClickAchievementLink(title) {
    const targetLink = findAchievementEntryElement(title, { preferLink: true });
    if (!targetLink || targetLink.tagName !== 'A') return false;

    targetLink.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    setTimeout(() => {
        targetLink.click();
    }, 340);
    return true;
}

async function navigateToSearchResultByIndex(index) {
    const result = renderedSearchResults[index];
    if (!result) return;

    if (result.type === 'achievement') {
        const achievementRoute = '/achievements';
        const openAchievementLink = async () => {
            closeGlobalSearch();

            const externalLink = getAchievementLink(result.data);
            const achievementTitle = result.data.name || '';
            const achievementCategory = result.data.type || 'Achievement';
            const achievementInfo = result.data.info || '';

            if (externalLink) {
                const focusAndClick = () => {
                    const clicked = centerAndClickAchievementLink(achievementTitle);
                    if (clicked) return;

                    if (typeof window.openExternalLinkWithPrompt === 'function') {
                        window.openExternalLinkWithPrompt(externalLink, achievementTitle || 'Achievement Link', achievementCategory, achievementInfo);
                    } else {
                        window.open(externalLink, '_blank', 'noopener,noreferrer');
                    }
                };

                if (window.location.pathname !== achievementRoute && !window.location.pathname.endsWith(achievementRoute)) {
                    navigateTo(achievementRoute);
                    waitForDataToLoad().then(() => {
                        setTimeout(focusAndClick, 300);
                    });
                    return;
                }

                waitForDataToLoad().then(focusAndClick);
                return;
            }

            const scrollToResultEntry = () => {
                scrollToAchievementEntry(achievementTitle);
            };

            if (window.location.pathname !== achievementRoute && !window.location.pathname.endsWith(achievementRoute)) {
                navigateTo(achievementRoute);
                waitForDataToLoad().then(() => {
                    setTimeout(scrollToResultEntry, 300);
                });
                return;
            }

            waitForDataToLoad().then(scrollToResultEntry);
        };

        await openAchievementLink();
        return;
    }

    if (result.type === 'activity') {
        const activityRoute = '/activities';
        const activityTitle = result.data.name || '';
        const activityCategory = result.data.type || 'Activity';
        const activityLink = getActivityLink(result.data);
        closeGlobalSearch();

        const focusAndClick = () => {
            const clicked = centerAndClickActivityLink(activityTitle);
            if (clicked) return;

            if (activityLink) {
                if (typeof window.openExternalLinkWithPrompt === 'function') {
                    window.openExternalLinkWithPrompt(activityLink, activityTitle || 'Activity Link', activityCategory);
                } else {
                    window.open(activityLink, '_blank', 'noopener,noreferrer');
                }
                return;
            }

            scrollToActivityEntry(activityTitle);
        };

        if (window.location.pathname !== activityRoute && !window.location.pathname.endsWith(activityRoute)) {
            navigateTo(activityRoute);
            waitForDataToLoad().then(() => {
                setTimeout(focusAndClick, 300);
            });
            return;
        }

        waitForDataToLoad().then(focusAndClick);
        return;
    }

    if (result.type === 'course') {
        const courseRoute = '/courses';
        closeGlobalSearch();

        const focusCourse = () => {
            const query = String(result.data.id || result.data.courseid || result.data.name || '').trim();
            openModalForSearchResult(query, 'course');
        };

        if (window.location.pathname !== courseRoute && !window.location.pathname.endsWith(courseRoute)) {
            navigateTo(courseRoute);
            waitForDataToLoad().then(() => {
                setTimeout(focusCourse, 300);
            });
            return;
        }

        waitForDataToLoad().then(focusCourse);
        return;
    }

    navigateToSearchResult(result.route, result.data.name || '', result.type);
}

function normalizeActivityText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function findActivityCardByName(name) {
    const normalizedName = normalizeActivityText(name);
    if (!normalizedName) return null;

    const cards = Array.from(document.querySelectorAll('.activity-card[data-activity-name]'));
    return cards.find((card) => {
        const cardName = normalizeActivityText(card.getAttribute('data-activity-name') || '');
        return cardName === normalizedName || cardName.includes(normalizedName) || normalizedName.includes(cardName);
    }) || null;
}

function findActivityLinkElement(name) {
    const targetCard = findActivityCardByName(name);
    if (!targetCard) return null;
    const link = targetCard.querySelector('a.activity-external-link');
    return link && link.tagName === 'A' ? link : null;
}

function scrollToActivityEntry(name) {
    const targetCard = findActivityCardByName(name);
    if (!targetCard) return false;
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    return true;
}

function centerAndClickActivityLink(name) {
    const targetLink = findActivityLinkElement(name);
    if (!targetLink) return false;

    targetLink.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    setTimeout(() => {
        targetLink.click();
    }, 340);
    return true;
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
            const hasActivityCards = document.querySelectorAll('.activity-card[data-activity-name]').length > 0;
            const hasCourseRows = document.querySelectorAll('.course-row[data-course-index]').length > 0;
            const hasCoursesTable = !!document.getElementById('courses-table-body');
            const notSkeletons = !document.querySelector('.skeleton-card, .skeleton-item');
            const hasSearchInput = document.getElementById('portfolio-search');
            const hasActivitiesContainer = !!document.getElementById('activities-list');
            const hasCoursesContainer = !!document.getElementById('courses-table-body');

            const path = (window.location && window.location.pathname) ? window.location.pathname : '';
            const route = path.endsWith('/technical') ? '/technical'
                : path.endsWith('/videos') ? '/videos'
                : path.endsWith('/games') ? '/games'
                : path.endsWith('/courses') ? '/courses'
                : path.endsWith('/activities') ? '/activities'
                : path.endsWith('/achievements') ? '/achievements'
                : '';

            const readyForRoute = route === '/technical'
                ? hasSkillItems
                : (route === '/videos' || route === '/games')
                    ? hasPortfolioCards
                    : route === '/courses'
                        ? (hasCoursesTable && (hasCourseRows || notSkeletons))
                        : route === '/activities'
                            ? (hasActivitiesContainer && (hasActivityCards || notSkeletons))
                            : route === '/achievements'
                                ? (notSkeletons || document.getElementById('presidents-list-items'))
                                : (hasPortfolioCards || hasSkillItems || hasActivityCards || hasCourseRows || hasCoursesTable);

            if (readyForRoute && (hasSearchInput || hasActivitiesContainer || hasCoursesContainer || route === '/achievements')) {
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
    if (type === 'course') {
        const query = String(title || '').trim();
        const normalized = query.toLowerCase();
        if (!normalized) return;

        const coursesSearchInput = document.getElementById('courses-search-input');
        if (coursesSearchInput) {
            coursesSearchInput.value = query;
            if (window.state) {
                window.state.courseSearchQuery = query;
            }
            coursesSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const rows = Array.from(document.querySelectorAll('.course-row[data-course-index]'));
        const target = rows.find((row) => {
            const cells = row.querySelectorAll('td');
            const id = (cells[0]?.textContent || '').trim().toLowerCase();
            const name = (cells[1]?.textContent || '').trim().toLowerCase();
            return id === normalized || name === normalized || id.includes(normalized) || name.includes(normalized);
        });
        if (target) target.click();
        return;
    }

    const searchInput = document.getElementById('portfolio-search');
    
    if (searchInput && window.state) {
        searchInput.value = title;
        const clearBtn = searchInput.closest('.search-container')?.querySelector('.input-clear-button');
        if (clearBtn) {
            clearBtn.classList.toggle('visible', Boolean(searchInput.value && String(searchInput.value).length > 0));
        }
        
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
