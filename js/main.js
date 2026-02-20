document.addEventListener('DOMContentLoaded', () => {
    const routes = {
        '/': { fragment: 'html/pages/bio.html', title: 'BIO' },
        '/bio': { fragment: 'html/pages/bio.html', title: 'BIO' },
        '/achievements': { fragment: 'html/pages/achievements.html', title: 'ACHIEVEMENTS' },
        '/technical': { fragment: 'html/pages/technical.html', title: 'TECHNICAL' },
        '/videos': { fragment: 'html/pages/videos.html', title: 'VIDEOS' },
        '/games': { fragment: 'html/pages/games.html', title: 'GAMES' }
    };

    const filmFestivalAwards = {
        "Toothbrush Chronicles: Super Hill": [
            { award: "Video of the Year", location: "Rogers High School | 86th Avenue Film Festival", date: "JUNE 2025" },
            { award: "Best Use of Dialogue", location: "Rogers High School | 86th Avenue Film Festival", date: "JUNE 2025" }
        ],
        "House of Pain - Jump Around": [
            { award: "Video of the Year", location: "Rogers High School | 86th Avenue Film Festival", date: "JAN 2025" }
        ],
        "Two Highschoolers Fight Using Toothbrushes": [
            { award: "Best Editing", location: "Rogers High School | 86th Avenue Film Festival", date: "JUNE 2024" },
            { award: "Best Use of Prop", location: "Rogers High School | 86th Avenue Film Festival", date: "JUNE 2024" }
        ],
        "House of Horrors": [
            { award: "Best Short Film", location: "Emerald Ridge High School | Clock Tower Film Festival", date: "APRIL 2025" }
        ]
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
        skillsList: null,
        achievementsList: null,
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
        allData: null,
        dataPromise: null,
        filmFestivalAwards: filmFestivalAwards,

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
        if (lower.endsWith('/html/achievements.html') || lower.endsWith('/achievements.html')) return '/achievements';
        if (lower.endsWith('/index.html')) return '/';
        return null;
    };

    const resolveAppRoot = (pathname) => {
        const legacyMatch = pathname.match(/^(.*)\/html\/[^/]+\.html$/i);
        if (legacyMatch) return legacyMatch[1];
        const normalized = pathname.replace(/\/index\.html$/i, '');
        const match = routePaths.find(route => route !== '/' && normalized.endsWith(route));
        if (match) return normalized.slice(0, -match.length);
        if (normalized.endsWith('/')) return normalized.slice(0, -1);
        return normalized === '/' ? '' : normalized;
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
        state.skillsList = document.getElementById('skills-list');
        state.achievementsList = document.getElementById('achievements-list');
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

    const preloadImage = (src, timeoutMs) => new Promise(resolve => {
        if (!src) {
            resolve({ ok: false, src: '' });
            return;
        }
        const img = new Image();
        let settled = false;
        const finish = (ok, finalSrc) => {
            if (settled) return;
            settled = true;
            clearTimeout(timerId);
            resolve({ ok, src: finalSrc || src });
        };
        const timerId = setTimeout(() => finish(false, src), timeoutMs || 3500);
        img.onload = () => {
            const isPlaceholder = src.includes('youtube.com/vi/') && 
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
                'maxresdefault',
                'hqdefault',
                'mqdefault',
                'default'
            ];
            
            for (const quality of thumbnailQualities) {
                const thumbSrc = `https://img.youtube.com/vi/${youtubeID}/${quality}.jpg`;
                const result = await preloadImage(thumbSrc, 3500);
                if (result.ok) return thumbSrc;
            }
            
            return `https://img.youtube.com/vi/${youtubeID}/default.jpg`;
        }
        const raw = state.renderer.fixImagePath(project.gallery?.[0] || '');
        if (!raw) return '';
        await preloadImage(raw, 3500);
        return raw;
    };

    const preloadProjectThumbs = async (projects) => {
        const tasks = projects.map(async project => {
            project.resolvedThumb = await resolveProjectThumb(project);
        });
        await Promise.all(tasks);
    };

    const preloadSkillIcons = async (skills) => {
        const tasks = skills.map(async skill => {
            const iconSrc = state.renderer.fixImagePath(skill.icon);
            skill.resolvedIcon = iconSrc || '';
            if (iconSrc) await preloadImage(iconSrc, 2500);
        });
        await Promise.all(tasks);
    };

    const setupAchievementVideoLinks = (projects) => {
        if (!projects || !projects.length) return;
        const anchors = Array.from(document.querySelectorAll('.achievement-card a'));
        const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const isVideoSearchLink = (href) => {
            const lower = (href || '').toLowerCase();
            return lower.includes('search=') && (lower.includes('videos.html') || lower.includes('/videos'));
        };
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
                        if (state.openModalForItem) state.openModalForItem(match);
                    } else {
                        if (href && href !== '#') {
                            const targetUrl = new URL(href, window.location.origin);
                            const route = resolveRoute(targetUrl.pathname);
                            if (routes[route]) navigate(route, targetUrl.search);
                            else window.location.href = href;
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

    const bindModalButtons = () => {
        if (state.closeBtn) state.closeBtn.onclick = () => state.modalManager?.resetModal();
        if (state.secCloseBtn) state.secCloseBtn.onclick = () => state.modalManager?.resetSecModal();
        if (state.secPrevBtn) state.secPrevBtn.onclick = (e) => { e.stopPropagation(); state.modalManager?.navigateTool(-1); };
        if (state.secNextBtn) state.secNextBtn.onclick = (e) => { e.stopPropagation(); state.modalManager?.navigateTool(1); };

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

    const ensureGlobalEvents = (() => {
        let bound = false;
        return () => {
            if (bound) return;
            bound = true;

            document.addEventListener('keydown', (e) => {
                if (state.secModal && state.secModal.style.display === 'flex') {
                    if (e.key === 'ArrowLeft') state.modalManager?.navigateTool(-1);
                    if (e.key === 'ArrowRight') state.modalManager?.navigateTool(1);
                    if (e.key === 'Escape') state.modalManager?.resetSecModal();
                } else if (state.modal && state.modal.style.display === 'flex') {
                    if (e.key === 'ArrowLeft') state.modalManager?.navigateItem(-1);
                    if (e.key === 'ArrowRight') state.modalManager?.navigateItem(1);
                    if (e.key === 'Escape') state.modalManager?.resetModal();
                }
            });

            document.addEventListener('click', (e) => {
                document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));

                const link = e.target.closest('a[data-route]');
                if (!link) return;
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                const route = link.getAttribute('data-route') || '/';
                e.preventDefault();
                navigate(route, '');
            });

            window.addEventListener('scroll', () => {
                document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
            }, { passive: true });

            window.onclick = function (event) {
                if (event.target === state.modal) state.modalManager?.resetModal();
                else if (event.target === state.secModal) state.modalManager?.resetSecModal();
            };
        };
    })();

    const loadDataOnce = () => {
        if (state.dataPromise) return state.dataPromise;
        state.dataPromise = dataService.loadAllData()
            .then(data => {
                state.allData = data;
                return data;
            })
            .catch(err => {
                console.error("Error loading data:", err);
                throw err;
            });
        return state.dataPromise;
    };

    const applyDataForRoute = (token) => {
        if (!state.renderer) return;
        loadDataOnce()
            .then(data => {
                if (state.routeToken !== token) return;

                if (state.currentRoute === '/achievements') {
                    setupAchievementVideoLinks(data.videos || []);
                }

                if (state.portfolioGrid) {
                    const pageType = state.currentRoute === '/games' ? 'games' : 'videos';
                    const projectData = data[pageType] || [];
                    setStoredCount(state.skeletonKey, projectData.length);
                    if (!state.didPrimeSkeletons || state.primedSkeletonTarget !== 'portfolio' || state.primedSkeletonCount !== projectData.length) {
                        state.renderer.showSkeletons(state.portfolioGrid, projectData.length);
                    }

                    if (projectData.length === 0) {
                        state.portfolioGrid.innerHTML = `<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 40px;">No projects found for "${pageType}".</p>`;
                    }
                    if (projectData.length > 0) {
                        Promise.all([
                            preloadProjectThumbs(projectData),
                            delay(900)
                        ]).then(() => {
                            if (state.routeToken !== token) return;
                            try {
                                state.renderer.renderProjects(projectData);
                            } catch (e) {
                                console.error("Render error:", e);
                            }
                        });
                    }
                }

                if (state.skillsList) {
                    const skillData = data.skills || [];
                    const isAchievements = state.currentRoute === '/achievements';
                    const dynamicCount = isAchievements ? skillData.filter(s => s.certified === true).length : skillData.length;
                    setStoredCount(state.skeletonKey, dynamicCount);
                    if (!state.didPrimeSkeletons || state.primedSkeletonTarget !== 'skills' || state.primedSkeletonCount !== dynamicCount) {
                        state.renderer.showSkeletons(state.skillsList, dynamicCount);
                    }
                    Promise.all([
                        preloadSkillIcons(skillData),
                        delay(800)
                    ]).then(() => {
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

        const nextUrl = buildUrl(route, search || '');
        if (!options || options.push !== false) {
            window.history.pushState(null, '', nextUrl);
        }

        updateNavActive(route);
        document.title = routeInfo.title;

        const token = ++state.routeToken;
        try {
            const response = await fetch(routeInfo.fragment);
            if (!response.ok) throw new Error(`Failed to load ${routeInfo.fragment}`);
            const html = await response.text();
            if (state.routeToken !== token) return;
            root.innerHTML = html;
            await injectFragments(root, route);
            initializePage(route);
        } catch (err) {
            if (state.routeToken !== token) return;
            root.innerHTML = '<div class="page-intro"><h2>Page not found</h2><p>The page could not be loaded.</p></div>';
            initializePage('/');
        }
    };

    const navigate = (route, search) => loadRoute(route, search, { push: true });

    updateNavLinks();
    updateNavActive(resolveRoute(window.location.pathname));
    ensureGlobalEvents();

    dataService.fetchLastUpdated();
    dataService.startTimeUpdates();

    const initialUrl = new URL(window.location.href);
    const initialRoute = resolveRoute(initialUrl.pathname);
    loadRoute(initialRoute, initialUrl.search, { push: false });

    window.addEventListener('popstate', () => {
        const url = new URL(window.location.href);
        loadRoute(resolveRoute(url.pathname), url.search, { push: false });
    });
});
