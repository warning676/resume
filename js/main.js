document.addEventListener('DOMContentLoaded', () => {
    let initialRouteHydrated = false;
    const routes = {
        '/': { fragment: 'html/pages/bio.html', title: 'BIO' },
        '/bio': { fragment: 'html/pages/bio.html', title: 'BIO' },
        '/activities': { fragment: 'html/pages/activities.html', title: 'ACTIVITIES' },
        '/achievements': { fragment: 'html/pages/achievements.html', title: 'ACHIEVEMENTS' },
        '/technical': { fragment: 'html/pages/technical.html', title: 'TECHNICAL' },
        '/videos': { fragment: 'html/pages/videos.html', title: 'VIDEOS' },
        '/games': { fragment: 'html/pages/games.html', title: 'GAMES' }
    };

    const state = {
        modal: null,
        closeBtn: null,
        videoFrame: null,
        mediaContainer: null,
        prevBtn: null,
        nextBtn: null,
        secModal: null,
        secCloseBtn: null,
        secPrevBtn: null,
        secNextBtn: null,
        externalLinkModal: null,
        externalLinkTitleEl: null,
        externalLinkCategoryEl: null,
        externalLinkUrlEl: null,
        externalLinkResolve: null,
        skillsList: null,
        achievementsList: null,
        activitiesList: null,
        portfolioGrid: null,
        noResults: null,
        toolSelectContainer: null,
        typeSelectContainer: null,
        sortSelectContainer: null,
        orderSelectContainer: null,
        searchContainer: null,
        searchInput: null,

        selectedCategories: ['all'],
        selectedTools: ['all'],
        selectedSort: null,
        selectedOrder: 'desc',
        searchQuery: '',
        currentItemCard: null,
        currentGalleryIndex: 0,
        currentToolsContext: [],
        currentToolIndex: -1,
        achievementVideos: [],
        currentAchievementVideoIndex: -1,
        showModalNavArrows: false,
        allData: null,
        dataPromise: null,
        filmFestivalAwards: {},

        openModalForItem: null,
        filterCards: null,
        filterSkills: null,
        sortCards: null,
        sortSkills: null,
        updateTypeFilter: null,
        updateToolFilter: null,
        runFiltering: null,

        modalManager: null,
        filterManager: null,
        controlsManager: null,
        renderer: null,

        currentRoute: '/',
        isSkillsPage: false,
        isAchievementsPage: false,
        isPortfolioPage: false,
        routeToken: 0,

        didPrimeSkeletons: false,
        primedSkeletonCount: 0,
        primedSkeletonTarget: null,
        skeletonKey: null
    };

    const dataService = new DataService('12V7XnylQtfLmT1ux5Va-DPhKc201m3fht9JstupnHdk');
    
    window.dataService = dataService;
    
    window.state = state;
    
    const routePaths = Object.keys(routes).sort((a, b) => b.length - a.length);

    const applyRedirectPath = () => {
        const redirectPath = sessionStorage.getItem('spa-redirect');
        if (redirectPath) {
            sessionStorage.removeItem('spa-redirect');
            window.history.replaceState(null, '', redirectPath);
        }
    };

    const resolveLegacyRoute = (pathname) => {
        const lower = pathname.toLowerCase();
        if (lower.endsWith('/html/videos.html') || lower.endsWith('/videos.html')) return '/videos';
        if (lower.endsWith('/html/games.html') || lower.endsWith('/games.html')) return '/games';
        if (lower.endsWith('/html/technical.html') || lower.endsWith('/technical.html')) return '/technical';
        if (lower.endsWith('/html/activities.html') || lower.endsWith('/activities.html')) return '/activities';
        if (lower.endsWith('/html/achievements.html') || lower.endsWith('/achievements.html')) return '/achievements';
        if (lower.endsWith('/index.html')) return '/';
        return null;
    };

    const resolveAppRoot = (pathname) => {
        const legacyMatch = pathname.match(/^(.*)\/html\/[^/]+\.html$/i);
        if (legacyMatch) return legacyMatch[1];
        const normalized = pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '');
        const match = routePaths.find(route => route !== '/' && normalized.endsWith(route));
        if (match) return normalized.slice(0, -match.length);
        return normalized;
    };

    applyRedirectPath();
    const appRoot = resolveAppRoot(window.location.pathname);

    const stripAppRoot = (pathname) => {
        if (appRoot && pathname.startsWith(appRoot)) {
            const stripped = pathname.slice(appRoot.length);
            return stripped || '/';
        }
        return pathname || '/';
    };

    const resolveRoute = (pathname) => {
        const legacy = resolveLegacyRoute(pathname);
        if (legacy) return legacy;
        const stripped = stripAppRoot(pathname);
        if (!stripped || stripped === '/') return '/';
        const normalized = stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
        return routes[normalized] ? normalized : '/';
    };

    const buildUrl = (route, search) => {
        const suffix = route === '/' ? '/' : route;
        const base = appRoot || '';
        const path = `${base}${suffix}`;
        return search ? `${path}${search}` : path;
    };

    const normalizeCanonicalUrl = () => {
        const currentRoute = resolveRoute(window.location.pathname);
        const currentSearch = window.location.search || '';
        const canonicalUrl = buildUrl(currentRoute, currentSearch);
        const currentUrl = `${window.location.pathname}${currentSearch}`;
        if (currentUrl !== canonicalUrl) {
            window.history.replaceState(null, '', canonicalUrl);
        }
    };

    normalizeCanonicalUrl();

    const getExternalLinkTarget = (url) => {
        const raw = String(url || '').trim();
        if (!raw) return '';
        try {
            const parsed = new URL(raw, window.location.origin);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.href;
            }
        } catch (err) {
        }
        return '';
    };

    const syncExternalLinkModalScrollLock = (locked) => {
        const body = document.body;
        const html = document.documentElement;
        if (!body || !html) return;

        if (locked) {
            body.style.overflow = 'hidden';
            html.style.overflow = 'hidden';
            return;
        }

        const searchModal = document.getElementById('global-search-modal');
        const searchModalOpen = !!(searchModal && searchModal.classList.contains('active'));
        const mainModalOpen = !!(state.modal && state.modal.style.display === 'flex');
        const secModalOpen = !!(state.secModal && state.secModal.style.display === 'flex');
        const hasOpenDropdown = !!document.querySelector('.custom-select-container.open, .multi-select-container.open');
        if (searchModalOpen || mainModalOpen || secModalOpen || hasOpenDropdown) return;

        body.style.overflow = '';
        html.style.overflow = '';
    };

    const closeExternalLinkModal = (confirmed) => {
        if (!state.externalLinkModal) return;
        if (state.externalLinkModal._fadeTimer) {
            clearTimeout(state.externalLinkModal._fadeTimer);
            state.externalLinkModal._fadeTimer = null;
        }

        const resolver = state.externalLinkResolve;
        state.externalLinkResolve = null;
        state.externalLinkModal.style.transition = 'opacity 160ms ease';
        state.externalLinkModal.style.opacity = '0';
        state.externalLinkModal._fadeTimer = setTimeout(() => {
            state.externalLinkModal.classList.remove('active');
            state.externalLinkModal.style.display = 'none';
            state.externalLinkModal.style.opacity = '';
            state.externalLinkModal._fadeTimer = null;
            syncExternalLinkModalScrollLock(false);
            if (resolver) resolver(!!confirmed);
        }, 170);
    };

    const showExternalLinkModal = (url, title, category) => {
        if (!state.externalLinkModal) return Promise.resolve(false);
        if (state.externalLinkModal._fadeTimer) {
            clearTimeout(state.externalLinkModal._fadeTimer);
            state.externalLinkModal._fadeTimer = null;
        }
        if (state.externalLinkResolve) {
            state.externalLinkResolve(false);
            state.externalLinkResolve = null;
        }

        if (state.externalLinkTitleEl) {
            const safeTitle = String(title || '').trim();
            const safeTitleText = safeTitle || 'External Link';
            state.externalLinkTitleEl.innerHTML = `<strong>Title:</strong> ${safeTitleText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}`;
        }

        if (state.externalLinkCategoryEl) {
            const safeCategory = String(category || '').trim();
            state.externalLinkCategoryEl.innerHTML = safeCategory ? `<strong>Category:</strong> ${safeCategory.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}` : '';
            state.externalLinkCategoryEl.style.display = safeCategory ? 'block' : 'none';
        }

        if (state.externalLinkUrlEl) {
            const safeUrl = String(url || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            state.externalLinkUrlEl.innerHTML = `<strong style="color:#e1e4e8;">Link:</strong> <span style="color:#58a6ff;">${safeUrl}</span>`;
        }

        state.externalLinkModal.style.display = 'flex';
        state.externalLinkModal.classList.add('active');
        state.externalLinkModal.style.transition = 'opacity 160ms ease';
        state.externalLinkModal.style.opacity = '0';
        requestAnimationFrame(() => {
            state.externalLinkModal.style.opacity = '1';
        });
        syncExternalLinkModalScrollLock(true);

        return new Promise(resolve => {
            state.externalLinkResolve = resolve;
        });
    };

    const openExternalLinkWithPrompt = async (url, title, category) => {
        const target = getExternalLinkTarget(url);
        if (!target) return false;
        const confirmed = await showExternalLinkModal(target, title, category);
        if (!confirmed) return false;
        window.open(target, '_blank', 'noopener,noreferrer');
        return true;
    };

    window.resolveExternalLinkTarget = getExternalLinkTarget;
    window.openExternalLinkWithPrompt = openExternalLinkWithPrompt;

    const fragmentCache = new Map();

    const updateNavLinks = () => {
        document.querySelectorAll('.nav-links a[data-route]').forEach(link => {
            const route = link.getAttribute('data-route') || '/';
            link.setAttribute('href', buildUrl(route, ''));
        });
    };

    const getFragmentHtml = async (path) => {
        if (fragmentCache.has(path)) return fragmentCache.get(path);
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        const html = await response.text();
        fragmentCache.set(path, html);
        return html;
    };

    const injectFragments = async (root, route) => {
        const nodes = Array.from(root.querySelectorAll('[data-fragment]'));
        if (nodes.length === 0) return;
        for (const node of nodes) {
            const type = node.getAttribute('data-fragment');
            if (!type) continue;
            let path = null;
            if (type === 'controls') {
                const variant = node.getAttribute('data-variant') || (route === '/videos' || route === '/games' ? 'portfolio' : 'skills');
                path = `html/fragments/controls-${variant}.html`;
            } else if (type === 'modals') {
                path = 'html/fragments/modals.html';
            } else if (type === 'no-results') {
                const variant = node.getAttribute('data-variant') || (route === '/videos' || route === '/games' ? 'portfolio' : 'skills');
                path = `html/fragments/no-results-${variant}.html`;
            }
            if (!path) continue;
            const html = await getFragmentHtml(path);
            node.insertAdjacentHTML('beforebegin', html);
            node.remove();
        }
    };

    const updateNavActive = (route) => {
        document.querySelectorAll('.nav-links a').forEach(link => {
            const linkRoute = link.getAttribute('data-route') || '/';
            if (linkRoute === route) link.classList.add('active');
            else link.classList.remove('active');
        });
    };

    const resetPageState = () => {
        state.selectedCategories = ['all'];
        state.selectedTools = ['all'];
        state.selectedOrder = 'desc';
        state.searchQuery = '';
        state.currentItemCard = null;
        state.currentGalleryIndex = 0;
        state.currentToolsContext = [];
        state.currentToolIndex = -1;
        state.achievementVideos = [];
        state.currentAchievementVideoIndex = -1;
        state.didPrimeSkeletons = false;
        state.primedSkeletonCount = 0;
        state.primedSkeletonTarget = null;
        state.skeletonKey = null;
    };

    const syncDomReferences = () => {
        state.modal = document.getElementById("infoModal");
        state.closeBtn = document.querySelector(".close-button");
        state.videoFrame = document.getElementById("modal-video");
        state.mediaContainer = document.getElementById("media-container");
        state.prevBtn = document.getElementById("modal-prev");
        state.nextBtn = document.getElementById("modal-next");
        state.secModal = document.getElementById("secondaryModal");
        state.secCloseBtn = document.querySelector(".sec-close-button");
        state.secPrevBtn = document.getElementById("sec-modal-prev");
        state.secNextBtn = document.getElementById("sec-modal-next");
        state.externalLinkModal = document.getElementById('external-link-modal');
        state.externalLinkTitleEl = document.getElementById('external-link-title');
        state.externalLinkCategoryEl = document.getElementById('external-link-category');
        state.externalLinkUrlEl = document.getElementById('external-link-url');
        state.skillsList = document.getElementById('skills-list');
        state.achievementsList = document.getElementById('achievements-list');
        state.activitiesList = document.getElementById('activities-list');
        state.portfolioGrid = document.getElementById("portfolio-grid");
        state.noResults = document.getElementById("no-results");
        state.toolSelectContainer = document.getElementById('tool-select');
        state.typeSelectContainer = document.getElementById('type-select');
        state.sortSelectContainer = document.getElementById('sort-select');
        state.orderSelectContainer = document.getElementById('order-select');
        state.searchContainer = document.querySelector('.search-box');
        state.searchInput = document.getElementById("portfolio-search");
    };

    const getSkeletonKey = () => {
        if (state.portfolioGrid) return `portfolio:${state.currentRoute}`;
        if (state.skillsList) return `skills:${state.currentRoute}`;
        return null;
    };

    const getStoredCount = (key) => {
        if (!key) return 0;
        try {
            const raw = localStorage.getItem(key);
            const val = Number.parseInt(raw, 10);
            return Number.isFinite(val) && val > 0 ? val : 0;
        } catch (err) {
            return 0;
        }
    };

    const setStoredCount = (key, count) => {
        if (!key) return;
        try {
            const next = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
            localStorage.setItem(key, String(next));
        } catch (err) {
        }
    };

    const primeSkeletons = () => {
        state.skeletonKey = getSkeletonKey();
        if (!state.skeletonKey) return;
        const cachedCount = getStoredCount(state.skeletonKey);
        if (!cachedCount || !state.renderer) return;
        if (state.portfolioGrid) {
            state.renderer.showSkeletons(state.portfolioGrid, cachedCount);
            state.didPrimeSkeletons = true;
            state.primedSkeletonCount = cachedCount;
            state.primedSkeletonTarget = 'portfolio';
        } else if (state.skillsList) {
            state.renderer.showSkeletons(state.skillsList, cachedCount);
            state.didPrimeSkeletons = true;
            state.primedSkeletonCount = cachedCount;
            state.primedSkeletonTarget = 'skills';
        }
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const ROUTE_FADE_MS = 180;

    const prefersReducedMotion = () => {
        try {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (err) {
            return false;
        }
    };

    const ensureRouteTransitionSetup = (root) => {
        if (!root || root.dataset.routeTransitionReady === 'true') return;
        root.style.viewTransitionName = 'page-root';

        if (!document.getElementById('route-transition-style')) {
            const style = document.createElement('style');
            style.id = 'route-transition-style';
            style.textContent = `
                ::view-transition-old(page-root),
                ::view-transition-new(page-root) {
                    animation-duration: ${ROUTE_FADE_MS}ms;
                    animation-timing-function: ease;
                }
            `;
            document.head.appendChild(style);
        }

        root.dataset.routeTransitionReady = 'true';
    };

    const runRouteCrossfade = async (root, updateDom) => {
        if (!root) {
            updateDom();
            return;
        }

        if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
            updateDom();
            return;
        }

        ensureRouteTransitionSetup(root);
        const transition = document.startViewTransition(() => {
            updateDom();
        });

        try {
            await transition.finished;
        } catch (err) {
        }
    };

    const isSameRouteNavigation = (route, search) => {
        const currentRoute = resolveRoute(window.location.pathname);
        const currentSearch = window.location.search || '';
        const nextSearch = search || '';
        return route === currentRoute && nextSearch === currentSearch;
    };

    const shouldSkipRouteLoad = (route, search, root) => {
        if (!isSameRouteNavigation(route, search)) return false;
        if (state.routeToken <= 0) return false;
        if (state.currentRoute !== route) return false;
        if (!root) return false;
        const hasRenderedContent = root.children.length > 0 || (root.textContent || '').trim().length > 0;
        return hasRenderedContent;
    };

    const preloadImage = (src, timeoutMs) => new Promise(resolve => {
        if (!src) {
            resolve({ ok: false, src: '', cached: false });
            return;
        }
        const img = new Image();
        const startTime = Date.now();
        let settled = false;
        const finish = (ok, finalSrc) => {
            if (settled) return;
            settled = true;
            clearTimeout(timerId);
            const loadTime = Date.now() - startTime;
            const cached = ok && loadTime < 50;
            resolve({ ok, src: finalSrc || src, cached });
        };
        const timerId = setTimeout(() => finish(false, src), timeoutMs || 3500);
        img.onload = () => {
            const isPlaceholder = src.includes('/vi/') && 
                                  img.naturalWidth === 120 && 
                                  img.naturalHeight === 90;
            finish(!isPlaceholder, src);
        };
        img.onerror = () => finish(false, src);
        img.src = src;
    });

    const resolveProjectThumb = async (project) => {
        const youtubeID = Utils.extractYouTubeID(project.youtube || '');
        const hasValidYoutube = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";
        if (hasValidYoutube) {
            const thumbnailQualities = [
                'hqdefault',
                'mqdefault',
                'default'
            ];
            
            for (const quality of thumbnailQualities) {
                const thumbSrc = `https://i.ytimg.com/vi/${youtubeID}/${quality}.jpg`;
                const result = await preloadImage(thumbSrc, 3500);
                if (result.ok) return { src: thumbSrc, cached: result.cached };
            }
            
            return { src: `https://i.ytimg.com/vi/${youtubeID}/default.jpg`, cached: false };
        }
        const raw = state.renderer.fixImagePath(project.gallery?.[0] || '');
        if (!raw) return { src: '', cached: false };
        const result = await preloadImage(raw, 3500);
        return { src: raw, cached: result.cached };
    };

    const preloadProjectThumbs = async (projects) => {
        let allCached = true;
        const tasks = projects.map(async project => {
            const result = await resolveProjectThumb(project);
            project.resolvedThumb = result.src;
            if (!result.cached) allCached = false;
        });
        await Promise.all(tasks);
        return allCached;
    };

    const preloadSkillIcons = async (skills) => {
        let allCached = true;
        const tasks = skills.map(async skill => {
            const iconSrc = state.renderer.fixImagePath(skill.icon);
            skill.resolvedIcon = iconSrc || '';
            if (iconSrc) {
                const result = await preloadImage(iconSrc, 2500);
                if (!result.cached) allCached = false;
            }
        });
        await Promise.all(tasks);
        return allCached;
    };

    const setupAchievementVideoLinks = (projects) => {
        if (!projects || !projects.length) return;
        const anchors = Array.from(document.querySelectorAll('.achievement-card a'));
        const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const isVideoSearchLink = (href) => {
            const lower = (href || '').toLowerCase();
            return lower.includes('search=') && (lower.includes('videos.html') || lower.includes('/videos'));
        };
        
        const linkedVideoNames = new Set();
        anchors.forEach(a => {
            const projectNameAttr = a.getAttribute('data-project');
            if (projectNameAttr && projectNameAttr.trim()) {
                linkedVideoNames.add(normalize(projectNameAttr.trim()));
            }
        });
        
        const achievementVideos = [];
        const addedNames = new Set();
        anchors.forEach(a => {
            const projectNameAttr = a.getAttribute('data-project');
            if (projectNameAttr && projectNameAttr.trim()) {
                const nName = normalize(projectNameAttr.trim());
                if (!addedNames.has(nName)) {
                    const match = projects.find(p => normalize(p.name) === nName)
                        || projects.find(p => normalize(p.name).includes(nName))
                        || projects.find(p => nName.includes(normalize(p.name)));
                    if (match) {
                        achievementVideos.push(match);
                        addedNames.add(nName);
                    }
                }
            }
        });
        state.achievementVideos = achievementVideos;
        
        anchors.forEach(a => {
            try {
                const projectNameAttr = a.getAttribute('data-project');
                const href = a.getAttribute('href') || '';
                if (!projectNameAttr && !isVideoSearchLink(href)) return;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lookup = (projectNameAttr && projectNameAttr.trim()) ? projectNameAttr.trim() : null;
                    let decoded = lookup;
                    if (!decoded) {
                        const url = new URL(href, window.location.origin);
                        const searchVal = url.searchParams.get('search') || '';
                        decoded = decodeURIComponent(searchVal).trim();
                    }
                    const nDecoded = normalize(decoded);
                    const match = projects.find(p => normalize(p.name) === nDecoded)
                        || projects.find(p => normalize(p.name).includes(nDecoded))
                        || projects.find(p => nDecoded.includes(normalize(p.name)));
                    if (match) {
                        const videoIndex = state.achievementVideos.findIndex(v => v.name === match.name);
                        state.currentAchievementVideoIndex = videoIndex;
                        if (state.openModalForItem) state.openModalForItem(match);
                    } else {
                        if (href && href !== '#') {
                            const targetUrl = new URL(href, window.location.origin);
                            const route = resolveRoute(targetUrl.pathname);
                            if (routes[route]) navigate(route, targetUrl.search);
                            else openExternalLinkWithPrompt(targetUrl.href, decoded || projectNameAttr || 'External Link');
                        }
                    }
                });
                a.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        a.click();
                    }
                });
            } catch (err) {
            }
        });
    };

    const renderAchievementAwards = () => {
        const container = document.getElementById('festival-awards-container');
        if (!container) return;

        if (!document.getElementById('award-link-styles')) {
            const style = document.createElement('style');
            style.id = 'award-link-styles';
            style.textContent = '.award-video-link:hover { text-decoration: underline !important; }';
            document.head.appendChild(style);
        }

        const awards = state.filmFestivalAwards;
        if (!awards || Object.keys(awards).length === 0) {
            container.innerHTML = '<p style="color: #8b949e;">No awards found.</p>';
            return;
        }

        const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

        const awardsByType = {};
        
        Object.entries(awards).forEach(([projectName, projectAwards]) => {
            if (Array.isArray(projectAwards)) {
                projectAwards.forEach(award => {
                    if (!awardsByType[award.award]) {
                        awardsByType[award.award] = [];
                    }
                    awardsByType[award.award].push({
                        projectName,
                        date: award.date || '',
                        location: award.location || ''
                    });
                });
            }
        });

        const awardVideos = [];
        const addedVideoNames = new Set();
        
        Object.entries(awardsByType).forEach(([awardName, wins]) => {
            wins.forEach(win => {
                const nName = normalize(win.projectName);
                if (!addedVideoNames.has(nName)) {
                    const videos = state.allData?.videos || [];
                    const project = videos.find(v => normalize(v.name) === nName)
                        || videos.find(v => normalize(v.name).includes(nName))
                        || videos.find(v => nName.includes(normalize(v.name)));
                    if (project) {
                        awardVideos.push(project);
                        addedVideoNames.add(nName);
                    }
                }
            });
        });
        
        container.innerHTML = '';
        Object.entries(awardsByType).forEach(([awardName, wins]) => {
            const card = document.createElement('div');
            card.style.cssText = 'background: #000000; border: 1px solid #30363d; padding: 12px; border-radius: 6px; display: flex; flex-direction: column;';
            
            let cardHTML = `<strong style="color: #ffffff; font-size: 0.85rem; text-transform: uppercase; display: block; margin-bottom: 8px;">${awardName}</strong>`;
            cardHTML += '<div style="display: flex; flex-direction: column; gap: 12px;">';
            
            wins.forEach((win, index) => {
                const locationParts = win.location.split('|').map(part => part.trim());
                const school = locationParts[0] || '';
                const festival = locationParts[1] || '';
                
                cardHTML += `<div style="display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <span class="award-video-link" data-project="${win.projectName}" role="button" tabindex="0" style="color: #58a6ff; text-decoration: none; font-size: 0.9rem; line-height: 1.2; cursor: pointer;">${win.projectName}</span>
                        <span style="color: #8b949e; font-size: 0.75rem; white-space: nowrap; margin-top: 2px;">${win.date}</span>
                    </div>
                    <small style="color: #8b949e; font-size: 0.75rem; line-height: 1.4;">${festival}<br/><span style="font-size: 0.65rem; opacity: 0.8;">${school}</span></small>
                </div>`;
            });
            
            cardHTML += '</div>';
            card.innerHTML = cardHTML;
            container.appendChild(card);
        });
        
        if (container._clickHandler) {
            container.removeEventListener('click', container._clickHandler);
        }
        
        container._clickHandler = (e) => {
            const link = e.target.closest('.award-video-link');
            if (!link) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const projectName = link.getAttribute('data-project');
            const nName = normalize(projectName);
            
            const project = awardVideos.find(v => normalize(v.name) === nName)
                || awardVideos.find(v => normalize(v.name).includes(nName))
                || awardVideos.find(v => nName.includes(normalize(v.name)));
            
            if (project && state.modalManager) {
                state.achievementVideos = awardVideos;
                state.currentAchievementVideoIndex = awardVideos.indexOf(project);
                state.showModalNavArrows = true;
                state.modalManager.openModalForItem(project, 'videos', awardVideos);
            }
        };
        
        container.addEventListener('click', container._clickHandler);
    };

    const renderAcademicAchievements = () => {
        const presidentsContainer = document.getElementById('presidents-list-items');
        const honorRollContainer = document.getElementById('honor-roll-items');
        const nominationsContainer = document.getElementById('nominations-items');
        if (!presidentsContainer || !honorRollContainer || !nominationsContainer) return;

        const rows = Array.isArray(state.allData?.Achievements) ? state.allData.Achievements : [];
        const grouped = {
            presidents: [],
            honorRoll: [],
            nominations: []
        };

        const schoolRows = Array.isArray(state.allData?.School) ? state.allData.School : [];
        const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
        const formatGpa = (value) => {
            const raw = (value ?? '').toString().trim();
            if (!raw) return '';
            const num = Number.parseFloat(raw);
            if (!Number.isFinite(num)) return raw;
            return num.toFixed(1);
        };
        const toTag = (schoolName) => {
            const words = (schoolName || '')
                .split(/\s+/)
                .map(word => word.trim())
                .filter(Boolean)
                .filter(word => !['of', 'the', 'and'].includes(word.toLowerCase()));
            const tag = words.map(word => word[0]).join('').toUpperCase();
            return tag || 'SCHOOL';
        };

        const findSchoolProfile = (predicate, fallbackName) => {
            const row = schoolRows.find(predicate);
            const name = (row?.school || row?.name || fallbackName || '').toString().trim();
            const gpa = formatGpa(row?.gpa);
            return {
                name,
                normalizedName: normalizeText(name),
                tag: toTag(name),
                gpa
            };
        };

        const collegeProfile = findSchoolProfile(row => {
            const schoolName = normalizeText(row?.school || row?.name || '');
            const status = normalizeText(row?.status || '');
            return schoolName.includes('university') || schoolName.includes('college') || status.includes('enrolled');
        }, 'Southern New Hampshire University');

        const highSchoolProfile = findSchoolProfile(row => {
            const schoolName = normalizeText(row?.school || row?.name || '');
            const status = normalizeText(row?.status || '');
            return schoolName.includes('high school') || status.includes('graduated');
        }, 'Emerald Ridge High School');

        const collegeTagEl = document.getElementById('achievement-college-tag');
        const collegeNameEl = document.getElementById('achievement-college-name');
        const highSchoolTagEl = document.getElementById('achievement-highschool-tag');
        const highSchoolNameEl = document.getElementById('achievement-highschool-name');
        const collegeSchoolSkeletonEl = document.getElementById('achievement-college-school-skeleton');
        const highSchoolSkeletonEl = document.getElementById('achievement-highschool-school-skeleton');
        if (collegeTagEl) {
            collegeTagEl.textContent = collegeProfile.tag;
            collegeTagEl.style.display = 'inline-block';
        }
        if (collegeNameEl) {
            collegeNameEl.textContent = collegeProfile.name;
            collegeNameEl.style.display = 'block';
        }
        if (highSchoolTagEl) {
            highSchoolTagEl.textContent = highSchoolProfile.tag;
            highSchoolTagEl.style.display = 'inline-block';
        }
        if (highSchoolNameEl) {
            highSchoolNameEl.textContent = highSchoolProfile.name;
            highSchoolNameEl.style.display = 'block';
        }
        if (collegeSchoolSkeletonEl) collegeSchoolSkeletonEl.style.display = 'none';
        if (highSchoolSkeletonEl) highSchoolSkeletonEl.style.display = 'none';

        const collegeGpaEl = document.getElementById('achievement-college-gpa');
        const collegeGpaSkeletonEl = document.getElementById('achievement-college-gpa-skeleton');
        const collegeGpaTextEl = document.getElementById('achievement-college-gpa-text');
        const collegeGpaValueEl = document.getElementById('achievement-college-gpa-value');
        if (collegeGpaEl && collegeGpaValueEl && collegeGpaTextEl && collegeGpaSkeletonEl) {
            if (collegeProfile.gpa) {
                collegeGpaValueEl.textContent = collegeProfile.gpa;
                collegeGpaEl.style.display = 'block';
                collegeGpaSkeletonEl.style.display = 'none';
                collegeGpaTextEl.style.display = 'inline';
            } else {
                collegeGpaValueEl.textContent = '';
                collegeGpaEl.style.display = 'none';
                collegeGpaSkeletonEl.style.display = 'inline-block';
                collegeGpaTextEl.style.display = 'none';
            }
        }

        const collegeSchoolNames = schoolRows
            .filter(row => {
                const schoolName = normalizeText(row?.school || row?.name || '');
                const status = normalizeText(row?.status || '');
                return schoolName.includes('university') || schoolName.includes('college') || status.includes('enrolled');
            })
            .map(row => normalizeText(row?.school || row?.name || ''))
            .filter(Boolean);
        const highSchoolNames = schoolRows
            .filter(row => {
                const schoolName = normalizeText(row?.school || row?.name || '');
                const status = normalizeText(row?.status || '');
                return schoolName.includes('high school') || status.includes('graduated');
            })
            .map(row => normalizeText(row?.school || row?.name || ''))
            .filter(Boolean);

        if (!collegeSchoolNames.length) {
            collegeSchoolNames.push(collegeProfile.normalizedName, 'southern new hampshire university', 'southern new hampshire');
        }
        if (!highSchoolNames.length) {
            highSchoolNames.push(highSchoolProfile.normalizedName, 'emerald ridge high school', 'emerald ridge');
        }

        rows.forEach(row => {
            const type = (row?.type || '').toString().trim().toLowerCase();
            const school = (row?.school || '').toString().trim().toLowerCase();
            const name = (row?.name || '').toString().trim();
            const link = (row?.link || '').toString().trim();
            if (!name) return;
            const item = { name, link };
            const isSNHU = collegeSchoolNames.some(schoolName => school.includes(schoolName));
            const isERHS = highSchoolNames.some(schoolName => school.includes(schoolName));

            if (type.includes('president') && (isSNHU || !school)) grouped.presidents.push({ ...item, category: "President's List" });
            else if (type.includes('honor') && (isSNHU || !school)) grouped.honorRoll.push({ ...item, category: 'Honor Roll' });
            else if (type.includes('nomination') && (isERHS || !school)) grouped.nominations.push({ ...item, category: 'Nominations' });
        });

        const renderInlineItems = (container, items, textColor = '#58a6ff') => {
            container.innerHTML = '';
            if (!items.length) {
                const empty = document.createElement('span');
                empty.style.color = '#8b949e';
                empty.style.fontSize = '0.9rem';
                empty.textContent = 'No entries yet.';
                container.appendChild(empty);
                return;
            }

            items.forEach(item => {
                const hasLink = /^https?:\/\//i.test(item.link);
                if (hasLink) {
                    const anchor = document.createElement('a');
                    anchor.href = item.link;
                    anchor.target = '_self';
                    anchor.rel = 'noopener noreferrer';
                    anchor.style.color = textColor;
                    anchor.style.textDecoration = 'none';
                    anchor.style.fontSize = '0.9rem';
                    anchor.textContent = item.name;
                    anchor.addEventListener('click', (e) => {
                        e.preventDefault();
                        openExternalLinkWithPrompt(item.link, item.name || 'External Link', item.category || 'Achievement');
                    });
                    container.appendChild(anchor);
                    return;
                }

                const plain = document.createElement('span');
                plain.style.color = '#e1e4e8';
                plain.style.fontSize = '0.9rem';
                plain.textContent = item.name;
                container.appendChild(plain);
            });
        };

        renderInlineItems(presidentsContainer, grouped.presidents, '#58a6ff');
        renderInlineItems(honorRollContainer, grouped.honorRoll, '#58a6ff');
        renderInlineItems(nominationsContainer, grouped.nominations, '#e1e4e8');
    };

    const renderBioEducation = () => {
        const educationList = document.getElementById('education-list');
        if (!educationList) return;

        const rows = Array.isArray(state.allData?.School) ? state.allData.School : [];
        if (!rows.length) {
            educationList.innerHTML = '<p style="color: #8b949e; text-align: center; padding: 20px;">Education information is loading.</p>';
            return;
        }

        const getTag = (schoolName) => {
            const words = schoolName
                .split(/\s+/)
                .map(word => word.trim())
                .filter(Boolean)
                .filter(word => !['of', 'the', 'and'].includes(word.toLowerCase()));
            const tag = words.map(word => word[0]).join('').toUpperCase();
            return tag || 'SCHOOL';
        };

        const getProgram = (schoolName) => {
            const normalized = schoolName.toLowerCase();
            if (normalized.includes('southern new hampshire')) return 'Bachelor of Science in Computer Science (Software Engineering)';
            if (normalized.includes('high school')) return 'High School Diploma';
            return 'Education';
        };

        const formatGpa = (value) => {
            const raw = (value ?? '').toString().trim();
            if (!raw) return '';
            const num = Number.parseFloat(raw);
            if (!Number.isFinite(num)) return raw;
            return num.toFixed(1);
        };

        educationList.innerHTML = rows.map((row, index) => {
            const schoolName = (row?.school || row?.name || '').toString().trim();
            const location = (row?.location || '').toString().trim();
            const started = (row?.started || '').toString().trim();
            const status = (row?.status || '').toString().trim();
            const gpa = formatGpa(row?.gpa);
            const tag = getTag(schoolName);
            const program = getProgram(schoolName);
            const marginTop = index === 0 ? '20px' : '12px';
            const gpaRow = gpa
                ? `<div style="font-size: 0.9rem; color: #8b949e; margin-top: 10px;">
                <span><strong style="color: #58a6ff;">GPA:</strong> ${gpa}</span>
            </div>`
                : '';

            return `
    <div class="achievement-card" style="background: #000000; border: 1px solid #1f2428; margin-top: ${marginTop};">
        <div class="achievement-info">
            <span class="software-tag">${tag}</span>
            <h3>${schoolName}</h3>
            <p>${program}</p>
            <p style="font-size: 0.85rem; color: #8b949e; margin-bottom: 5px;">${location}</p>
            <div style="font-size: 0.9rem; color: #8b949e; margin-top: 10px;">
                <span style="margin-right: 25px;"><strong style="color: #58a6ff;">Started:</strong> ${started}</span>
                <span><strong style="color: #58a6ff;">Status:</strong> ${status}</span>
            </div>
            ${gpaRow}
        </div>
    </div>`;
        }).join('');
    };

    const renderActivities = () => {
        const container = state.activitiesList;
        if (!container) return;

        const rows = Array.isArray(state.allData?.Activities) ? state.allData.Activities : [];
        if (!rows.length) {
            container.innerHTML = '<p style="color: #8b949e; text-align: center; padding: 20px;">No activities added yet.</p>';
            return;
        }

        const toText = (value) => (value ?? '').toString().trim();
        const toDateRange = (startRaw, endRaw) => {
            const start = toText(startRaw);
            const end = toText(endRaw);
            if (start && end) return `${start} - ${end}`;
            if (start) return `${start} - Present`;
            if (end) return end;
            return '';
        };
        const isHttp = (url) => /^https?:\/\//i.test(toText(url));
        const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        container.innerHTML = rows.map((row, index) => {
            const name = toText(row.name) || 'Untitled Activity';
            const school = toText(row.school);
            const type = toText(row.type) || 'Activity';
            const description = toText(row.description || row.info);
            const link = toText(row.link);
            const role = toText(row.role);
            const status = toText(row.status);
            const dateRange = toDateRange(row.startdate || row.started, row.enddate || row.ended);
            const hasLink = isHttp(link);
            const marginTop = index === 0 ? '0' : '14px';

            const metaParts = [dateRange, role, status].filter(Boolean);
            const metaLine = metaParts.length
                ? `<p style="font-size: 0.85rem; color: #8b949e; margin: 10px 0 0 0;">${escapeHtml(metaParts.join(' • '))}</p>`
                : '';

            return `
                <div class="achievement-card activity-card" data-activity-name="${escapeHtml(name)}" style="background: #000000; border: 1px solid #1f2428; margin-top: ${marginTop};">
                    <div class="achievement-info">
                        <span class="software-tag">${escapeHtml(type.toUpperCase())}</span>
                        <h3>${escapeHtml(name)}</h3>
                        <p style="font-size: 0.92rem; color: #8b949e; margin: 6px 0 0 0;">${escapeHtml(school || 'Organization not specified')}</p>
                        ${metaLine}
                        <p style="margin-top: 12px; line-height: 1.55; color: #e1e4e8;">${escapeHtml(description || 'Description coming soon.')}</p>
                        ${hasLink ? `<a class="activity-external-link" href="${escapeHtml(link)}" data-title="${escapeHtml(name)}" data-category="${escapeHtml(type || 'Activity')}" style="display: inline-flex; align-items: center; margin-top: 12px; color: #58a6ff; text-decoration: none; font-weight: 600;">View Activity</a>` : ''}
                    </div>
                </div>`;
        }).join('');

        container.querySelectorAll('.activity-external-link').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const url = anchor.getAttribute('href') || '';
                const title = anchor.getAttribute('data-title') || 'External Link';
                const category = anchor.getAttribute('data-category') || 'Activity';
                openExternalLinkWithPrompt(url, title, category);
            });
        });
    };

    const bindModalButtons = () => {
        if (state.closeBtn) state.closeBtn.onclick = () => state.modalManager?.resetModal();
        if (state.secCloseBtn) state.secCloseBtn.onclick = () => state.modalManager?.resetSecModal();
        if (state.secPrevBtn) state.secPrevBtn.onclick = (e) => { e.stopPropagation(); state.modalManager?.navigateTool(-1); };
        if (state.secNextBtn) state.secNextBtn.onclick = (e) => { e.stopPropagation(); state.modalManager?.navigateTool(1); };

        const externalCancelBtn = document.getElementById('external-link-cancel');
        const externalStayBtn = document.getElementById('external-link-stay');
        const externalContinueBtn = document.getElementById('external-link-continue');

        if (externalCancelBtn) externalCancelBtn.onclick = () => closeExternalLinkModal(false);
        if (externalStayBtn) externalStayBtn.onclick = () => closeExternalLinkModal(false);
        if (externalContinueBtn) externalContinueBtn.onclick = () => closeExternalLinkModal(true);

        if (state.prevBtn) {
            state.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.modalManager?.navigateItem(-1);
            });
        }
        if (state.nextBtn) {
            state.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.modalManager?.navigateItem(1);
            });
        }
    };

    const syncDropdownScrollLock = () => {
        const hasOpenDropdown = !!document.querySelector('.custom-select-container.open, .multi-select-container.open');
        if (hasOpenDropdown) {
            document.body.classList.add('dropdown-scroll-lock');
            document.documentElement.classList.add('dropdown-scroll-lock');
        } else {
            document.body.classList.remove('dropdown-scroll-lock');
            document.documentElement.classList.remove('dropdown-scroll-lock');
        }
    };

    window.syncDropdownScrollLock = syncDropdownScrollLock;

    const ensureGlobalEvents = (() => {
        let bound = false;
        return () => {
            if (bound) return;
            bound = true;

            document.addEventListener('keydown', (e) => {
                if (state.externalLinkModal && state.externalLinkModal.classList.contains('active')) {
                    if (e.key === 'Escape') closeExternalLinkModal(false);
                } else if (state.secModal && state.secModal.style.display === 'flex') {
                    if (state.currentToolsContext.length > 1) {
                        if (e.key === 'ArrowLeft') state.modalManager?.navigateTool(-1);
                        if (e.key === 'ArrowRight') state.modalManager?.navigateTool(1);
                    }
                    if (e.key === 'Escape') state.modalManager?.resetSecModal();
                } else if (state.modal && state.modal.style.display === 'flex') {
                    if (state.showModalNavArrows) {
                        if (e.key === 'ArrowLeft') state.modalManager?.navigateItem(-1);
                        if (e.key === 'ArrowRight') state.modalManager?.navigateItem(1);
                    }
                    if (e.key === 'Escape') state.modalManager?.resetModal();
                }
            });

            document.addEventListener('click', (e) => {
                document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
                syncDropdownScrollLock();

                const link = e.target.closest('a[data-route]');
                if (!link) return;
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                const route = link.getAttribute('data-route') || '/';
                if (isSameRouteNavigation(route, '')) {
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                navigate(route, '');
            });

            let modalMousedownTarget = null;
            
            window.addEventListener('mousedown', (event) => {
                modalMousedownTarget = event.target;
            });
            
            window.onclick = function (event) {
                if (event.target === state.modal && modalMousedownTarget === state.modal) {
                    state.modalManager?.resetModal();
                } else if (event.target === state.secModal && modalMousedownTarget === state.secModal) {
                    state.modalManager?.resetSecModal();
                } else if (event.target === state.externalLinkModal && modalMousedownTarget === state.externalLinkModal) {
                    closeExternalLinkModal(false);
                }
                modalMousedownTarget = null;
            };
        };
    })();

    const loadDataOnce = () => {
        if (!state.allData) state.allData = {};
        const route = state.currentRoute;
        const sheetsNeeded = [];
        
        if (route === '/videos') {
            if (!state.allData.videos) sheetsNeeded.push('videos');
            if (!state.allData.skills) sheetsNeeded.push('skills');
        }
        if (route === '/games') {
            if (!state.allData.games) sheetsNeeded.push('games');
            if (!state.allData.skills) sheetsNeeded.push('skills');
        }
        if (route === '/technical' && !state.allData.skills) sheetsNeeded.push('skills');
        if ((route === '/' || route === '/bio') && !state.allData.School) sheetsNeeded.push('School');
        if (route === '/achievements') {
            if (!state.allData.videos) sheetsNeeded.push('videos');
            if (!state.allData.skills) sheetsNeeded.push('skills');
            if (!state.allData.Achievements) sheetsNeeded.push('Achievements');
            if (!state.allData.School) sheetsNeeded.push('School');
        }
        if (route === '/activities' && !state.allData.Activities) sheetsNeeded.push('Activities');
        
        if (sheetsNeeded.length === 0) {
            return Promise.resolve({ data: state.allData, allCached: true });
        }
        
        let allCached = true;
        return Promise.all(sheetsNeeded.map(sheet => 
            dataService.loadSheet(sheet).then(result => {
                state.allData[sheet] = result.data;
                if (!result.fromCache) allCached = false;
                if (sheet === 'videos') {
                    state.filmFestivalAwards = dataService.buildFilmFestivalAwards(result.data || []);
                }
                return result.data;
            })
        )).then(() => ({ data: state.allData, allCached })).catch(err => {
            const container = state.portfolioGrid || state.skillsList;
            if (container) {
                container.innerHTML = '<p style="color: #ff6b6b; grid-column: 1/-1; text-align: center; padding: 40px;">Unable to load data. Please check your connection and refresh the page.</p>';
            }
            throw err;
        });
    };

    const applyDataForRoute = (token) => {
        if (!state.renderer) return;
        const dataPromise = loadDataOnce();
        dataPromise.then(result => {
                const data = result.data;
                const isCached = result.allCached;
                if (state.routeToken !== token) return;

                if (state.currentRoute === '/achievements') {
                    const renderAchievementsNow = () => {
                        if (state.routeToken !== token) return;
                        renderAcademicAchievements();
                        setupAchievementVideoLinks(data.videos || []);
                        renderAchievementAwards();
                    };

                    if (isCached) {
                        setTimeout(renderAchievementsNow, 120);
                    } else {
                        renderAchievementsNow();
                    }
                }

                if (state.currentRoute === '/' || state.currentRoute === '/bio') {
                    renderBioEducation();
                }

                if (state.currentRoute === '/activities') {
                    renderActivities();
                }

                if (state.portfolioGrid) {
                    const pageType = state.currentRoute === '/games' ? 'games' : 'videos';
                    const projectData = data[pageType] || [];
                    setStoredCount(state.skeletonKey, projectData.length);
                    
                    if (!isCached && (!state.didPrimeSkeletons || state.primedSkeletonTarget !== 'portfolio' || state.primedSkeletonCount !== projectData.length)) {
                        state.renderer.showSkeletons(state.portfolioGrid, projectData.length);
                    }

                    if (projectData.length === 0) {
                        state.portfolioGrid.innerHTML = `<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 40px;">No projects found for "${pageType}".</p>`;
                    }
                    if (projectData.length > 0) {
                        const startTime = Date.now();
                        preloadProjectThumbs(projectData).then(imagesCached => {
                            const loadTime = Date.now() - startTime;
                            const smoothingDelay = imagesCached ? 0 : Math.max(0, 150 - loadTime);
                            return delay(smoothingDelay);
                        }).then(() => {
                            if (state.routeToken !== token) return;
                            try {
                                state.renderer.renderProjects(projectData);
                            } catch (e) {
                                if (state.portfolioGrid) {
                                    state.portfolioGrid.innerHTML = '<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 40px;">Unable to display projects. Please refresh the page.</p>';
                                }
                            }
                        });
                    }
                }

                if (state.skillsList) {
                    const skillData = data.skills || [];
                    const isAchievements = state.currentRoute === '/achievements';
                    const dynamicCount = isAchievements ? skillData.filter(s => s.certified === true).length : skillData.length;
                    setStoredCount(state.skeletonKey, dynamicCount);
                    
                    if (!isCached && (!state.didPrimeSkeletons || state.primedSkeletonTarget !== 'skills' || state.primedSkeletonCount !== dynamicCount)) {
                        state.renderer.showSkeletons(state.skillsList, dynamicCount);
                    }
                    
                    const startTime = Date.now();
                    preloadSkillIcons(skillData).then(iconsCached => {
                        const loadTime = Date.now() - startTime;
                        const smoothingDelay = iconsCached ? 0 : Math.max(0, 150 - loadTime);
                        return delay(smoothingDelay);
                    }).then(() => {
                        if (state.routeToken !== token) return;
                        state.renderer.renderSkills(skillData);
                    });
                }
            })
            .catch(() => {
            });
    };

    const initializePage = (route) => {
        resetPageState();
        syncDomReferences();
        state.currentRoute = route;
        state.isSkillsPage = !!state.skillsList;
        state.isAchievementsPage = route === '/achievements';
        state.isPortfolioPage = !!state.portfolioGrid;
        state.selectedSort = state.isSkillsPage ? 'lastUsed' : 'date';

        state.modalManager = new ModalManager(state);
        state.filterManager = new FilterManager(state);
        state.controlsManager = new ControlsManager(state);
        state.renderer = new Renderer(state);

        state.openModalForItem = (...args) => state.modalManager.openModalForItem(...args);
        state.filterCards = () => state.filterManager.filterCards();
        state.filterSkills = () => state.filterManager.filterSkills();
        state.sortCards = () => state.filterManager.sortCards();
        state.sortSkills = () => state.filterManager.sortSkills();
        state.updateTypeFilter = (cats) => state.controlsManager.updateTypeFilter(cats);
        state.updateToolFilter = (tools) => state.controlsManager.updateToolFilter(tools);
        state.runFiltering = () => state.filterManager.runFiltering();

        state.controlsManager.initControlSkeletons();
        state.controlsManager.renderStaticControls();
        primeSkeletons();
        bindModalButtons();

        const token = ++state.routeToken;
        applyDataForRoute(token);
    };

    const loadRoute = async (route, search, options) => {
        const routeInfo = routes[route] || routes['/'];
        const root = document.getElementById('page-root');
        if (!root) return;

        document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
        document.body.classList.remove('dropdown-scroll-lock');
        document.documentElement.classList.remove('dropdown-scroll-lock');

        if (shouldSkipRouteLoad(route, search, root)) return;

        const nextUrl = buildUrl(route, search || '');
        if (!options || options.push !== false) {
            window.history.pushState(null, '', nextUrl);
        }

        updateNavActive(route);
        document.title = `${routeInfo.title} - Benjamin Reynolds`;

        const token = ++state.routeToken;
        try {
            const response = await fetch(routeInfo.fragment);
            if (!response.ok) throw new Error(`Failed to load ${routeInfo.fragment}`);
            const html = await response.text();
            if (state.routeToken !== token) return;
            const nextRoot = document.createElement('div');
            nextRoot.innerHTML = html;
            await injectFragments(nextRoot, route);
            if (state.routeToken !== token) return;
            if (!initialRouteHydrated) {
                root.innerHTML = nextRoot.innerHTML;
                initializePage(route);
                initialRouteHydrated = true;
            } else {
                await runRouteCrossfade(root, () => {
                    root.innerHTML = nextRoot.innerHTML;
                    initializePage(route);
                });
            }
        } catch (err) {
            if (state.routeToken !== token) return;
            if (!initialRouteHydrated) {
                root.innerHTML = '<div class="page-intro"><h2>Page not found</h2><p>The page could not be loaded.</p></div>';
                initializePage('/');
                initialRouteHydrated = true;
            } else {
                await runRouteCrossfade(root, () => {
                    root.innerHTML = '<div class="page-intro"><h2>Page not found</h2><p>The page could not be loaded.</p></div>';
                    initializePage('/');
                });
            }
        }
    };

    const navigate = (route, search) => loadRoute(route, search, { push: true });
    
    window.navigateTo = navigate;

    const renderInitialRouteSkeleton = (route) => {
        const root = document.getElementById('page-root');
        if (!root) return;

        if (route === '/achievements') {
            root.innerHTML = `
                <div class="page-intro">
                    <div class="skeleton-element" style="width: 280px; height: 34px; border-radius: 6px; margin-bottom: 10px;"></div>
                    <div class="skeleton-element" style="width: 420px; max-width: 90%; height: 14px; border-radius: 4px;"></div>
                </div>
                <div class="achievement-card" style="background: #000000; border: 1px solid #1f2428; margin-top: 20px;">
                    <div class="achievement-info">
                        <div class="skeleton-element" style="width: 56px; height: 20px; border-radius: 6px;"></div>
                        <div class="skeleton-element" style="width: 320px; max-width: 80%; height: 26px; border-radius: 6px; margin-top: 14px;"></div>
                        <div class="skeleton-element" style="width: 210px; height: 13px; border-radius: 4px; margin-top: 8px;"></div>
                        <div style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 12px;">
                            <div class="skeleton-element" style="width: 180px; height: 14px; border-radius: 4px;"></div>
                            <div class="skeleton-element" style="width: 160px; height: 14px; border-radius: 4px;"></div>
                            <div class="skeleton-element" style="width: 220px; height: 14px; border-radius: 4px;"></div>
                            <div class="skeleton-element" style="width: 150px; height: 14px; border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
                <div class="achievement-card" style="background: #000000; border: 1px solid #1f2428; margin-top: 20px;">
                    <div class="achievement-info">
                        <div class="skeleton-element" style="width: 56px; height: 20px; border-radius: 6px;"></div>
                        <div class="skeleton-element" style="width: 290px; max-width: 80%; height: 26px; border-radius: 6px; margin-top: 14px;"></div>
                        <div class="skeleton-element" style="width: 250px; height: 13px; border-radius: 4px; margin-top: 8px;"></div>
                        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                            <div class="skeleton-element" style="width: 260px; max-width: 90%; height: 14px; border-radius: 4px;"></div>
                            <div class="skeleton-element" style="width: 220px; max-width: 90%; height: 14px; border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
                <hr style="border: 0; border-top: 1px solid #1f2428; margin-top: 25px;">
                <div class="achievement-card" style="background: #000000; border: 1px solid #1f2428; margin-top: 20px;">
                    <div class="achievement-info">
                        <div class="skeleton-element" style="width: 64px; height: 20px; border-radius: 6px;"></div>
                        <div class="skeleton-element" style="width: 320px; max-width: 85%; height: 26px; border-radius: 6px; margin-top: 14px;"></div>
                        <div class="skeleton-element" style="width: 220px; height: 13px; border-radius: 4px; margin-top: 8px;"></div>
                        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                            <div class="skeleton-element" style="height: 110px; border-radius: 6px;"></div>
                            <div class="skeleton-element" style="height: 110px; border-radius: 6px;"></div>
                            <div class="skeleton-element" style="height: 110px; border-radius: 6px;"></div>
                        </div>
                    </div>
                </div>
                <hr style="border: 0; border-top: 1px solid #1f2428; margin-top: 25px;">
                <div style="margin-top: 15px;">
                    <div class="skeleton-element" style="width: 230px; height: 30px; border-radius: 6px; margin-bottom: 10px;"></div>
                    <div class="skeleton-element" style="width: 360px; max-width: 90%; height: 14px; border-radius: 4px; margin-bottom: 18px;"></div>
                    <div class="skeleton-element" style="width: 100%; height: 320px; border-radius: 8px;"></div>
                </div>
            `;
            return;
        }

        root.innerHTML = `
            <div class="page-intro">
                <div class="skeleton-element" style="width: 260px; height: 34px; border-radius: 6px; margin-bottom: 10px;"></div>
                <div class="skeleton-element" style="width: 420px; max-width: 90%; height: 14px; border-radius: 4px;"></div>
            </div>
            <div class="skeleton-element" style="width: 100%; height: 420px; border-radius: 8px; margin-top: 16px;"></div>
        `;
    };

    updateNavLinks();
    updateNavActive(resolveRoute(window.location.pathname));
    ensureGlobalEvents();
    
    if (typeof initializeGlobalSearch === 'function') {
        initializeGlobalSearch();
    }

    dataService.fetchLastUpdated();
    dataService.startTimeUpdates();
    dataService.startConnectionStatusUpdates();

    const initialUrl = new URL(window.location.href);
    const initialRoute = resolveRoute(initialUrl.pathname);
    renderInitialRouteSkeleton(initialRoute);
    loadRoute(initialRoute, initialUrl.search, { push: false });

    window.addEventListener('popstate', () => {
        const url = new URL(window.location.href);
        loadRoute(resolveRoute(url.pathname), url.search, { push: false });
    });
});
