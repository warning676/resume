document.addEventListener('DOMContentLoaded', async () => {
    let initialRouteHydrated = false;
    const routes = {
        '/': { fragment: 'html/pages/bio.html', title: 'BIO' },
        '/bio': { fragment: 'html/pages/bio.html', title: 'BIO' },
        '/activities': { fragment: 'html/pages/activities.html', title: 'ACTIVITIES' },
        '/achievements': { fragment: 'html/pages/achievements.html', title: 'ACHIEVEMENTS' },
        '/technical': { fragment: 'html/pages/technical.html', title: 'TECHNICAL' },
        '/courses': { fragment: 'html/pages/courses.html', title: 'COURSES' },
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
        externalLinkInfoEl: null,
        externalLinkUrlEl: null,
        externalLinkResolve: null,
        skillsList: null,
        achievementsList: null,
        activitiesList: null,
        coursesTableBody: null,
        portfolioGrid: null,
        noResults: null,
        toolSelectContainer: null,
        typeSelectContainer: null,
        sortSelectContainer: null,
        orderSelectContainer: null,
        courseSortSelectContainer: null,
        courseOrderSelectContainer: null,
        searchContainer: null,
        searchInput: null,
        coursesSearchInput: null,
        coursesFilterButton: null,
        coursesFilterMenu: null,
        skillsFilterButton: null,
        skillsFilterMenu: null,
        portfolioFilterGroup: null,
        portfolioFilterButton: null,
        portfolioFilterMenu: null,
        coursesModal: null,
        coursesModalClose: null,
        coursesModalPrev: null,
        coursesModalNext: null,
        coursesModalTitle: null,
        coursesModalId: null,
        coursesModalSchool: null,
        coursesModalType: null,
        coursesModalStatus: null,
        coursesModalGrade: null,
        coursesModalCredits: null,
        coursesModalName: null,
        coursesModalInfo: null,

        selectedCategories: ['all'],
        selectedTools: ['all'],
        selectedSort: null,
        selectedOrder: 'desc',
        selectedCourseSort: 'status',
        selectedCourseOrder: 'asc',
        searchQuery: '',
        courseSearchQuery: '',
        selectedCourseColumnValues: {},
        selectedSkillColumnValues: {},
        selectedPortfolioColumnValues: {},
        filteredCourses: [],
        currentCourseIndex: -1,
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
        pendingFocusSchool: '',

        openModalForItem: null,
        filterCards: null,
        filterSkills: null,
        sortCards: null,
        sortSkills: null,
        updateTypeFilter: null,
        updateToolFilter: null,
        runFiltering: null,
        syncSkillSortIndicators: null,
        syncCourseSortIndicators: null,

        modalManager: null,
        filterManager: null,
        controlsManager: null,
        renderer: null,

        currentRoute: '/',
        isSkillsPage: false,
        isAchievementsPage: false,
        isPortfolioPage: false,
        isCoursesPage: false,
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
        if (lower.endsWith('/html/courses.html') || lower.endsWith('/courses.html')) return '/courses';
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



    const closeExternalLinkModal = (confirmed) => {
        if (!state.externalLinkModal) return;
        if (state.externalLinkModal._fadeTimer) {
            clearTimeout(state.externalLinkModal._fadeTimer);
            state.externalLinkModal._fadeTimer = null;
        }

        const resolver = state.externalLinkResolve;
        state.externalLinkResolve = null;
        const contentEl = state.externalLinkModal.querySelector('.external-link-modal-content');
        state.externalLinkModal.style.transition = 'opacity 160ms ease';
        state.externalLinkModal.style.opacity = '0';
        if (contentEl) {
            contentEl.style.transition = 'transform 160ms ease';
            contentEl.style.transform = 'translateY(8px)';
        }
        state.externalLinkModal._fadeTimer = setTimeout(() => {
            state.externalLinkModal.classList.remove('active');
            state.externalLinkModal.style.display = 'none';
            state.externalLinkModal.style.opacity = '';
            if (contentEl) contentEl.style.transform = '';
            state.externalLinkModal._fadeTimer = null;
            Utils.syncPageScrollLock(false);
            if (resolver) resolver(!!confirmed);
        }, 170);
    };

    const showExternalLinkModal = (url, title, category, info) => {
        if (!state.externalLinkModal) return Promise.resolve(false);
        if (state.externalLinkModal._fadeTimer) {
            clearTimeout(state.externalLinkModal._fadeTimer);
            state.externalLinkModal._fadeTimer = null;
        }
        if (state.externalLinkResolve) {
            state.externalLinkResolve(false);
            state.externalLinkResolve = null;
        }

        const isEmail = String(url).toLowerCase().startsWith('mailto:');

        if (state.externalLinkTitleEl) {
            if (isEmail) {
                state.externalLinkTitleEl.style.display = 'none';
            } else {
                const safeTitle = String(title || '').trim();
                const safeTitleText = safeTitle || 'External Link';
                state.externalLinkTitleEl.style.display = 'block';
                state.externalLinkTitleEl.innerHTML = `<strong style="color:#8b949e; text-transform:uppercase; font-size:0.7rem;">Title</strong><br>${safeTitleText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`;
            }
        }

        if (state.externalLinkCategoryEl) {
            if (isEmail) {
                state.externalLinkCategoryEl.style.display = 'none';
            } else {
                const safeCategory = String(category || '').trim();
                state.externalLinkCategoryEl.innerHTML = safeCategory ? `<strong style="color:#8b949e; text-transform:uppercase; font-size:0.7rem;">Category</strong><br>${safeCategory.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}` : '';
                state.externalLinkCategoryEl.style.display = safeCategory ? 'block' : 'none';
            }
        }

        if (state.externalLinkInfoEl) {
            if (isEmail) {
                state.externalLinkInfoEl.style.display = 'none';
            } else {
                const safeInfo = String(info || '').trim();
                const safeInfoText = safeInfo
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
                state.externalLinkInfoEl.innerHTML = safeInfo ? `<strong style="color:#8b949e; text-transform:uppercase; font-size:0.7rem;">Info</strong><br>${safeInfoText}` : '';
                state.externalLinkInfoEl.style.display = safeInfo ? 'block' : 'none';
            }
        }

        if (state.externalLinkUrlEl) {
            if (isEmail) {
                const emailStr = String(url).substring(7).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                state.externalLinkUrlEl.style.display = 'block';
                state.externalLinkUrlEl.innerHTML = `<strong style="color:#8b949e; text-transform:uppercase; font-size:0.7rem;">Email</strong><br><span style="color:#58a6ff;">${emailStr}</span>`;
            } else {
                const safeUrl = String(url || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                state.externalLinkUrlEl.style.display = 'block';
                state.externalLinkUrlEl.innerHTML = `<strong style="color:#8b949e; text-transform:uppercase; font-size:0.7rem;">Link</strong><br><span style="color:#58a6ff;">${safeUrl}</span>`;
            }
        }

        const messageEl = state.externalLinkModal.querySelector('.external-link-message') || document.getElementById('external-link-message');
        if (messageEl) {
            messageEl.textContent = isEmail ? 'Are you sure you want to send an email to this address?' : 'You are about to open an external website in a new tab.';
        }

        state.externalLinkModal.style.display = 'flex';
        state.externalLinkModal.classList.add('active');
        state.externalLinkModal.style.transition = 'opacity 160ms ease';
        state.externalLinkModal.style.opacity = '0';
        const contentEl = state.externalLinkModal.querySelector('.external-link-modal-content');
        if (contentEl) {
            contentEl.style.transition = 'transform 160ms ease';
            contentEl.style.transform = 'translateY(8px)';
        }
        requestAnimationFrame(() => {
            state.externalLinkModal.style.opacity = '1';
            if (contentEl) contentEl.style.transform = 'translateY(0)';
        });
        Utils.syncPageScrollLock(true);

        return new Promise(resolve => {
            state.externalLinkResolve = resolve;
        });
    };

    const openExternalLinkWithPrompt = async (url, title, category, info) => {
        const target = getExternalLinkTarget(url);
        if (!target) return false;
        const confirmed = await showExternalLinkModal(target, title, category, info);
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
                node.remove();
                continue;
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
        state.selectedCourseSort = 'status';
        state.selectedCourseOrder = 'asc';
        state.selectedCourseColumnValues = {};
        state.selectedSkillColumnValues = {};
        state.selectedPortfolioColumnValues = {};
        state.filteredCourses = [];
        state.currentCourseIndex = -1;
        state.searchQuery = '';
        state.courseSearchQuery = '';
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
        state.closeBtn = document.querySelector("#infoModal .close-button");
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
        state.externalLinkInfoEl = document.getElementById('external-link-info');
        state.externalLinkUrlEl = document.getElementById('external-link-url');
        state.skillsList = document.getElementById('skills-list');
        state.achievementsList = document.getElementById('achievements-list');
        state.activitiesList = document.getElementById('activities-list');
        state.coursesTableBody = document.getElementById('courses-table-body');
        state.portfolioGrid = document.getElementById("portfolio-grid");
        state.noResults = document.getElementById("no-results");
        state.toolSelectContainer = document.getElementById('tool-select');
        state.typeSelectContainer = document.getElementById('type-select');
        state.sortSelectContainer = document.getElementById('sort-select');
        state.orderSelectContainer = document.getElementById('order-select');
        state.courseSortSelectContainer = document.getElementById('course-sort-select');
        state.courseOrderSelectContainer = document.getElementById('course-order-select');
        state.searchContainer = document.querySelector('.search-box');
        state.searchInput = document.getElementById("portfolio-search");
        state.coursesSearchInput = document.getElementById('courses-search-input');
        state.globalSearchInput = document.getElementById('global-search-input');
        state.coursesFilterButton = document.getElementById('courses-filter-button');
        state.coursesFilterMenu = document.getElementById('courses-filter-menu');
        state.skillsFilterButton = document.getElementById('skills-filter-button');
        state.skillsFilterMenu = document.getElementById('skills-filter-menu');
        state.portfolioFilterGroup = document.getElementById('portfolio-filter-group');
        state.portfolioFilterButton = document.getElementById('portfolio-filter-button');
        state.portfolioFilterMenu = document.getElementById('portfolio-filter-menu');
        state.coursesModal = document.getElementById('courses-modal');
        state.coursesModalClose = document.getElementById('courses-modal-close');
        state.coursesModalPrev = document.getElementById('courses-modal-prev');
        state.coursesModalNext = document.getElementById('courses-modal-next');
        state.coursesModalTitle = document.getElementById('courses-modal-title');
        state.coursesModalId = document.getElementById('courses-modal-id');
        state.coursesModalSchool = document.getElementById('courses-modal-school');
        state.coursesModalType = document.getElementById('courses-modal-type');
        state.coursesModalStatus = document.getElementById('courses-modal-status');
        state.coursesModalGrade = document.getElementById('courses-modal-grade');
        state.coursesModalCredits = document.getElementById('courses-modal-credits');
        state.coursesModalName = document.getElementById('courses-modal-name');
        state.coursesModalInfo = document.getElementById('courses-modal-info');
        state.coursesModalYear = document.getElementById('courses-modal-year');
    };


    const getSkeletonKey = () => {
        if (state.portfolioGrid) return `portfolio:${state.currentRoute}`;
        if (state.skillsList) return `skills:${state.currentRoute}`;
        if (state.coursesTableBody) return `courses:${state.currentRoute}`;
        return null;
    };

    const showCoursesSkeleton = (count) => {
        if (!state.coursesTableBody || count <= 0) return;
        const rowWidths = [
            [190, 126, 92, 94, 60, 42, 60],
            [222, 138, 84, 102, 58, 46, 58],
            [204, 120, 98, 88, 62, 44, 62],
            [208, 126, 98, 96, 62, 42, 62],
        ];
        let html = '';
        for (let i = 0; i < count; i++) {
            const w = rowWidths[i % rowWidths.length];
            html += `<tr class="courses-skeleton-row">
                <td><div class="skeleton-element" style="width:44px;height:14px;border-radius:999px;"></div></td>
                <td><div class="skeleton-element" style="width:${w[0]}px;height:14px;border-radius:999px;"></div></td>
                <td><div class="skeleton-element" style="width:${w[1]}px;height:14px;border-radius:999px;"></div></td>
                <td><div class="skeleton-element" style="width:${w[2]}px;height:14px;border-radius:999px;"></div></td>
                <td><div class="skeleton-element" style="width:${w[3]}px;height:14px;border-radius:999px;"></div></td>
                <td><div class="skeleton-element" style="width:${w[4]}px;height:14px;border-radius:999px;"></div></td>
                <td><div class="skeleton-element" style="width:${w[5]}px;height:14px;border-radius:999px;"></div></td>
                <td><div class="skeleton-element" style="width:${w[6]}px;height:14px;border-radius:999px;"></div></td>
            </tr>`;
        }
        state.coursesTableBody.innerHTML = html;
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
        } else if (state.coursesTableBody) {
            showCoursesSkeleton(cachedCount);
            state.didPrimeSkeletons = true;
            state.primedSkeletonCount = cachedCount;
            state.primedSkeletonTarget = 'courses';
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
        const currentRoute = state.currentRoute || resolveRoute(window.location.pathname);
        const currentSearch = window.location.search || '';
        const nextSearch = search || '';

        if (route === currentRoute && !nextSearch) {
            return true;
        }

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

    function gradeToPoints(grade) {
        if (!grade) return null;
        const g = String(grade).trim().toUpperCase();
        if (g === 'A') return 4.0;
        if (g === 'A-') return 3.7;
        if (g === 'B+') return 3.3;
        if (g === 'B') return 3.0;
        if (g === 'B-') return 2.7;
        if (g === 'C+') return 2.3;
        if (g === 'C') return 2.0;
        if (g === 'C-') return 1.7;
        if (g === 'D+') return 1.3;
        if (g === 'D') return 1.0;
        if (g === 'D-') return 0.7;
        if (g === 'F') return 0.0;
        return null;
    }

    const getGpaBadgeHtml = (gpaVal) => {
        if (gpaVal === null || gpaVal === undefined) return '-';
        const formattedGpa = gpaVal.toFixed(1);
        const badgeClass = gpaVal >= 3.5 ? 'proficiency-beginner' : (gpaVal >= 3.0 ? 'proficiency-intermediate' : 'proficiency-advanced');
        const perfectClass = gpaVal >= 3.95 ? ' gpa-perfect' : '';
        return `<span class="proficiency-badge ${badgeClass}${perfectClass}">${formattedGpa}</span>`;
    };

    const capitalizeWords = (text) => {
        if (!text) return '';
        return text.toString().toLowerCase().replace(/(^|[ \(\/])([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    };

    function computeGpaForSchoolIdentifiers(identifiers) {
        const courses = normalizeCourses(state.allData?.Courses || []);
        const ids = Array.isArray(identifiers) ? identifiers.map(s => (s || '').toString().trim().toLowerCase()).filter(Boolean) : [];
        if (!ids.length) return null;
        let totalPoints = 0;
        let totalGpaCredits = 0;
        courses.forEach(c => {
            const school = (c.school || '').toString().trim().toLowerCase();
            const matches = ids.some(id => school.includes(id));
            if (!matches) return;
            const status = (c.status || '').toString().trim().toLowerCase();
            if (status !== 'completed') return;
            const credits = Number.parseFloat(String(c.credits || '').replace(/[^0-9\.\-]/g, ''));
            const grade = String(c.grade || '').trim();
            if (grade.toUpperCase() === 'CR') return;
            const pts = gradeToPoints(grade);
            if (pts !== null && Number.isFinite(credits)) {
                totalPoints += pts * credits;
                totalGpaCredits += credits;
            }
        });
        if (totalGpaCredits <= 0) return null;
        return (totalPoints / totalGpaCredits);
    }

    function renderCoursesDashboard() {
        const courses = normalizeCourses(state.allData?.Courses || []);
        const completed = courses.filter(c => String(c.status || '').toLowerCase() === 'completed');
        let totalPoints = 0;
        let totalGpaCredits = 0;
        let totalCompletedCredits = 0;
        completed.forEach(c => {
            const credits = Number.parseFloat(String(c.credits || '').replace(/[^0-9\.\-]/g, ''));
            if (Number.isFinite(credits)) totalCompletedCredits += credits;
            const grade = String(c.grade || '').trim();
            if (grade.toUpperCase() === 'CR') return;
            const pts = gradeToPoints(grade);
            if (pts !== null && Number.isFinite(credits)) {
                totalPoints += pts * credits;
                totalGpaCredits += credits;
            }
        });

        const gpaEl = document.getElementById('courses-dashboard-gpa');
        const standingEl = document.getElementById('courses-dashboard-standing');
        const creditsEl = document.getElementById('courses-dashboard-credits');
        const percentEl = document.getElementById('courses-dashboard-percent');
        const progressFillEl = document.getElementById('courses-dashboard-progress-fill');

        if (gpaEl) {
            const gpaVal = totalGpaCredits > 0 ? (totalPoints / totalGpaCredits) : 0;
            if (totalGpaCredits > 0) {
                gpaEl.innerHTML = getGpaBadgeHtml(gpaVal);
            } else {
                gpaEl.textContent = '-';
            }
        }
        if (standingEl) {
            let standing = '-';
            let standingClass = '';
            const c = Number.isFinite(totalCompletedCredits) ? totalCompletedCredits : NaN;
            if (Number.isFinite(c)) {
                if (c >= 90) { standing = 'Senior'; standingClass = 'standing-senior'; }
                else if (c >= 60) { standing = 'Junior'; standingClass = 'standing-junior'; }
                else if (c >= 30) { standing = 'Sophomore'; standingClass = 'standing-sophomore'; }
                else if (c >= 0) { standing = 'Freshman'; standingClass = 'standing-freshman'; }
            }
            standingEl.textContent = standing;
            standingEl.className = 'dashboard-value' + (standingClass ? ' ' + standingClass : '');
        }
        if (creditsEl) {
            creditsEl.textContent = `${String(totalCompletedCredits || 0)} / 120`;
        }
        if (percentEl) {
            const pct = (totalCompletedCredits / 120) * 100;
            percentEl.textContent = Number.isFinite(pct) ? `${pct.toFixed(1)}%` : '-';
        }
        if (progressFillEl) {
            const pct = (totalCompletedCredits / 120) * 100;
            if (Number.isFinite(pct)) progressFillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
            else progressFillEl.style.width = '0%';
        }
    }

    const renderAcademicAchievements = () => {
        const presidentsContainer = document.getElementById('presidents-list-items');
        const honorRollContainer = document.getElementById('honor-roll-items');
        const nominationsContainer = document.getElementById('nominations-items');
        if (!presidentsContainer || !honorRollContainer || !nominationsContainer) return;

        const scrollToFocusedSchoolCard = () => {
            const params = new URLSearchParams(window.location.search || '');
            const focusSchool = String(state.pendingFocusSchool || params.get('focusSchool') || '').toLowerCase();
            if (!focusSchool) return;

            const targetId = focusSchool === 'highschool'
                ? 'achievement-highschool-card'
                : focusSchool === 'college'
                    ? 'achievement-college-card'
                    : '';
            if (!targetId) return;

            const targetCard = document.getElementById(targetId);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
            state.pendingFocusSchool = '';
        };

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
            const abbreviation = (row?.schoolAbbreviation || '').toString().trim();
            const normalizedSchoolName = name.toLowerCase();
            const computedGpaVal = computeGpaForSchoolIdentifiers([normalizedSchoolName]);
            const gpa = (computedGpaVal !== null) ? String(Number(computedGpaVal.toFixed(1))) : formatGpa(row?.gpa);
            return {
                name,
                normalizedName: normalizeText(name),
                tag: abbreviation || toTag(name),
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

        const collegeGpaEl = document.getElementById('achievement-college-gpa');
        const collegeGpaSkeletonEl = document.getElementById('achievement-college-gpa-skeleton');
        const collegeGpaTextEl = document.getElementById('achievement-college-gpa-text');
        const collegeGpaValueEl = document.getElementById('achievement-college-gpa-value');
        if (collegeGpaEl && collegeGpaValueEl && collegeGpaTextEl && collegeGpaSkeletonEl) {
            const computedCollegeGpa = computeGpaForSchoolIdentifiers(collegeSchoolNames);
            if (computedCollegeGpa !== null) {
                collegeGpaValueEl.innerHTML = getGpaBadgeHtml(computedCollegeGpa);
                collegeGpaEl.style.display = 'block';
                collegeGpaSkeletonEl.style.display = 'none';
                collegeGpaTextEl.style.display = 'inline';
            } else if (collegeProfile.gpa) {
                const val = Number.parseFloat(collegeProfile.gpa);
                collegeGpaValueEl.innerHTML = Number.isFinite(val) ? getGpaBadgeHtml(val) : collegeProfile.gpa;
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

        rows.forEach(row => {
            const type = (row?.type || '').toString().trim().toLowerCase();
            const school = (row?.school || '').toString().trim().toLowerCase();
            const name = (row?.name || '').toString().trim();
            const link = (row?.link || '').toString().trim();
            const info = (row?.info || '').toString().trim();
            if (!name) return;
            const item = { name, link, info };
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
                const wrapper = document.createElement('div');
                wrapper.className = 'achievement-inline-item';

                const hasLink = /^https?:\/\//i.test(item.link);
                if (hasLink) {
                    const anchor = document.createElement('a');
                    anchor.href = item.link;
                    anchor.target = '_self';
                    anchor.rel = 'noopener noreferrer';
                    anchor.className = 'inline-action-button';
                    anchor.style.setProperty('--inline-action-color', textColor);
                    anchor.textContent = item.name;
                    anchor.addEventListener('click', (e) => {
                        e.preventDefault();
                        openExternalLinkWithPrompt(item.link, item.name || 'External Link', item.category || 'Achievement', item.info || '');
                    });
                    wrapper.appendChild(anchor);
                } else {
                    const plain = document.createElement('span');
                    plain.style.color = '#e1e4e8';
                    plain.style.fontSize = '0.9rem';
                    plain.textContent = item.name;
                    wrapper.appendChild(plain);
                }

                if (item.info) {
                    const info = document.createElement('span');
                    info.style.color = '#8b949e';
                    info.style.fontSize = '0.82rem';
                    info.style.whiteSpace = 'pre-line';
                    info.style.lineHeight = '1.4';
                    info.textContent = item.info;
                    wrapper.appendChild(info);
                }

                container.appendChild(wrapper);
            });
        };

        renderInlineItems(presidentsContainer, grouped.presidents, '#58a6ff');
        renderInlineItems(honorRollContainer, grouped.honorRoll, '#58a6ff');
        renderInlineItems(nominationsContainer, grouped.nominations, '#e1e4e8');
        scrollToFocusedSchoolCard();
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
            const schoolAbbreviation = (row?.schoolAbbreviation || '').toString().trim();
            const location = (row?.location || '').toString().trim();
            const started = (row?.started || '').toString().trim();
            const status = (row?.status || '').toString().trim();
            const gpa = formatGpa(row?.gpa);
            const tag = schoolAbbreviation || getTag(schoolName);
            const program = getProgram(schoolName);
            const normalizedSchoolName = schoolName.toLowerCase();
            const focusSchool = normalizedSchoolName.includes('high school') ? 'highschool' : 'college';
            const marginTop = index === 0 ? '20px' : '12px';
            const computedGpaVal = computeGpaForSchoolIdentifiers([normalizedSchoolName]);
            const displayGpaHtml = (computedGpaVal !== null) ? getGpaBadgeHtml(computedGpaVal) : (gpa ? getGpaBadgeHtml(Number.parseFloat(gpa)) : '');
            const gpaRow = displayGpaHtml
                ? `<div class="gpa-row" style="margin-top: 12px;">
                <span><span class="gpa-label">CUMULATIVE GPA:</span> ${displayGpaHtml}</span>
            </div>`
                : '';
            const achievementsLinkRow = `<div style="font-size: 0.9rem; margin-top: 10px;">
                <a href="#" class="education-achievements-link inline-action-button" data-focus-school="${focusSchool}">View Achievements</a>
            </div>`;

            return `
    <div class="achievement-card" style="background: #000000; border: 1px solid #1f2428; margin-top: ${marginTop};">
        <div class="achievement-info">
            <span class="software-tag">${tag}</span>
            <h3>${schoolName}</h3>
            <p>${program}</p>
            <p style="font-size: 0.85rem; color: #8b949e; margin-bottom: 5px;">${location}</p>
            <div class="gpa-row" style="margin-top: 10px; flex-wrap: wrap; gap: 25px;">
                <span><span class="gpa-label">STARTED:</span> ${capitalizeWords(started)}</span>
                <span><span class="gpa-label">STATUS:</span> ${capitalizeWords(status)}</span>
            </div>
            ${gpaRow}
            ${achievementsLinkRow}
        </div>
    </div>`;
        }).join('');

        educationList.querySelectorAll('.education-achievements-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const focusSchool = String(link.getAttribute('data-focus-school') || '').toLowerCase();
                if (!focusSchool) return;
                state.pendingFocusSchool = focusSchool;
                loadRoute('/achievements', '', {
                    push: false,
                    historyUrl: buildUrl('/', '')
                });
            });
        });
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
            const safeDescription = escapeHtml(description || 'Description coming soon.').replace(/\n/g, '<br>');

            return `
                <div class="achievement-card activity-card" data-activity-name="${escapeHtml(name)}" style="background: #000000; border: 1px solid #1f2428; margin-top: ${marginTop};">
                    <div class="achievement-info">
                        <span class="software-tag">${escapeHtml(type.toUpperCase())}</span>
                        <h3>${escapeHtml(name)}</h3>
                        <p style="font-size: 0.92rem; color: #8b949e; margin: 6px 0 0 0;">${escapeHtml(school || 'Organization not specified')}</p>
                        ${metaLine}
                        <p style="margin-top: 12px; line-height: 1.55; color: #e1e4e8; white-space: pre-line;">${safeDescription}</p>
                        ${hasLink ? `<a class="activity-external-link inline-action-button" href="${escapeHtml(link)}" data-title="${escapeHtml(name)}" data-category="${escapeHtml(type || 'Activity')}" style="margin-top: 12px;">View Activity</a>` : ''}
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

    const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const toText = (value) => (value ?? '').toString().trim();

    const syncCoursesModalScrollLock = (locked) => {
        const body = document.body;
        const html = document.documentElement;
        if (!body || !html) return;

        if (locked) {
            body.style.overflow = 'hidden';
            html.style.overflow = 'hidden';
            body.classList.add('modal-open');
            return;
        }

        const searchModal = document.getElementById('global-search-modal');
        const searchModalOpen = !!(searchModal && searchModal.classList.contains('active'));
        const mainModalOpen = !!(state.modal && state.modal.style.display === 'flex');
        const secModalOpen = !!(state.secModal && state.secModal.style.display === 'flex');
        const coursesModalOpen = !!(state.coursesModal && state.coursesModal.style.display === 'flex');
        const hasOpenDropdown = !!document.querySelector('.custom-select-container.open, .multi-select-container.open, .column-filter-menu.open');
        if (searchModalOpen || mainModalOpen || secModalOpen || coursesModalOpen || hasOpenDropdown) return;

        body.style.overflow = '';
        html.style.overflow = '';
        body.classList.remove('modal-open');
    };

    const closeAllColumnFilterMenus = () => {
        document.querySelectorAll('.column-filter-menu.open').forEach(menu => {
            menu.classList.remove('open');
        });
        document.querySelectorAll('.column-filter-item.active').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.filter-icon-button[aria-expanded="true"]').forEach(button => {
            button.setAttribute('aria-expanded', 'false');
        });
        syncCoursesModalScrollLock(false);
    };

    window.closeAllColumnFilterMenus = closeAllColumnFilterMenus;

    const NONE_FILTER_VALUE = '__NONE__';

    const formatFilterValueLabel = (value) => {
        const text = toText(value);
        if (!text) return '';
        if (/^[A-Z0-9]{2,}$/.test(text)) return text;
        return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    };

    const getColumnFilterScope = (button) => {
        const id = button?.id || '';
        if (id.startsWith('courses-')) return 'courses';
        if (id.startsWith('skills-')) return 'skills';
        if (id.startsWith('portfolio-')) return 'portfolio';
        return '';
    };

    const isActiveColumnFilterSelection = (selectedMap, key) => {
        const values = selectedMap?.[key];
        return Array.isArray(values) && values.length > 0 && !values.includes('all');
    };

    const hasActiveColumnFilters = (definitions, selectedMap) => {
        return (definitions || []).some(definition => isActiveColumnFilterSelection(selectedMap, definition.key));
    };

    const resetColumnFilterSelections = (definitions, selectedMap) => {
        (definitions || []).forEach(definition => {
            delete selectedMap[definition.key];
        });
    };

    const syncColumnFilterVisualState = (button, menu, definitions, selectedMap, onChange) => {
        if (!button || !menu) return;

        const hasActiveFilters = hasActiveColumnFilters(definitions, selectedMap);
        button.classList.toggle('has-active-filters', hasActiveFilters);

        const scope = getColumnFilterScope(button);
        if (scope) {
            document.querySelectorAll(`.column-header-filter-indicator[data-filter-scope="${scope}"]`).forEach(indicator => {
                const isActive = isActiveColumnFilterSelection(selectedMap, indicator.dataset.filterKey || '');
                indicator.classList.toggle('is-active', isActive);
            });
        }
    };

    const renderColumnFilterMenu = (button, menu, definitions, selectedMap, onChange, activeKey) => {
        if (!button || !menu) return;

        const positionColumnFilterMenu = () => {
            if (!menu.classList.contains('open')) return;
            const buttonRect = button.getBoundingClientRect();
            const viewportPad = 12;
            const viewportTop = viewportPad;
            const viewportBottom = window.innerHeight - viewportPad;
            const viewportLeft = viewportPad;
            const viewportRight = window.innerWidth - viewportPad;

            const gap = 6;
            const spaceBelow = Math.max(0, viewportBottom - buttonRect.bottom - gap);
            const spaceAbove = Math.max(0, buttonRect.top - viewportTop - gap);
            const naturalHeight = Math.ceil(menu.scrollHeight);
            const openUpward = naturalHeight > spaceBelow && spaceAbove > spaceBelow;

            menu.style.top = openUpward ? 'auto' : `calc(100% + ${gap}px)`;
            menu.style.bottom = openUpward ? `calc(100% + ${gap}px)` : 'auto';
            menu.style.maxHeight = '';
            menu.style.overflow = 'visible';

            menu.style.right = '0px';
            menu.style.left = 'auto';
            let rect = menu.getBoundingClientRect();
            if (rect.left < viewportLeft) {
                const shiftRight = viewportLeft - rect.left;
                menu.style.right = `${-(shiftRight)}px`;
                rect = menu.getBoundingClientRect();
            } else if (rect.right > viewportRight) {
                const shiftLeft = rect.right - viewportRight;
                const currentRight = Number.parseFloat((menu.style.right || '0').replace('px', '')) || 0;
                menu.style.right = `${currentRight + shiftLeft}px`;
                rect = menu.getBoundingClientRect();
            }

            let deltaY = 0;
            if (rect.bottom > viewportBottom) deltaY = rect.bottom - viewportBottom;
            if (rect.top - deltaY < viewportTop) deltaY = rect.top - viewportTop;
            if (deltaY) window.scrollBy({ top: deltaY, behavior: 'auto' });
        };

        const selected = selectedMap || {};
        const wasOpen = menu.classList.contains('open');
        const usableDefinitions = (definitions || []).map(definition => {
            const rawValues = (definition.values || []).map(value => toText(value));
            const hasMissing = rawValues.some(value => !value);
            const normalizedValues = Array.from(new Set(rawValues.filter(Boolean))).sort((a, b) => a.localeCompare(b));
            const values = hasMissing ? [NONE_FILTER_VALUE, ...normalizedValues] : normalizedValues;
            return { ...definition, values };
        }).filter(definition => definition.values.length > 0);

        syncColumnFilterVisualState(button, menu, usableDefinitions, selected, onChange);

        menu.classList.toggle('skip-animation', wasOpen);

        menu.innerHTML = '';

        const activateDefinition = (definitionKey) => {
            menu.querySelectorAll('.column-filter-item').forEach(node => {
                if (node.dataset.filterKey === definitionKey) node.classList.add('active');
                else node.classList.remove('active');
            });
        };

        usableDefinitions.forEach(definition => {
            const item = document.createElement('div');
            item.className = 'column-filter-item';
            item.dataset.filterKey = definition.key;
            if (activeKey && definition.key === activeKey) item.classList.add('active');
            const definitionIsActive = isActiveColumnFilterSelection(selected, definition.key);

            const label = document.createElement('button');
            label.type = 'button';
            label.className = 'column-filter-column-label';
            label.classList.toggle('has-active-filter', definitionIsActive);

            const labelText = document.createElement('span');
            labelText.className = 'column-filter-label-text';
            labelText.textContent = definition.label;

            const labelIndicator = document.createElement('span');
            labelIndicator.className = `column-filter-menu-indicator${definitionIsActive ? ' is-active' : ''}`;
            labelIndicator.setAttribute('aria-hidden', 'true');

            label.appendChild(labelText);
            label.appendChild(labelIndicator);
            item.appendChild(label);

            const subMenu = document.createElement('div');
            subMenu.className = 'column-filter-submenu';

            const keySelected = selected[definition.key];
            const isAllMode = keySelected === undefined || (Array.isArray(keySelected) && keySelected.includes('all'));
            const individualValues = definition.values;

            const allRow = document.createElement('label');
            allRow.className = 'column-filter-value-row';
            const allCheckbox = document.createElement('input');
            allCheckbox.type = 'checkbox';
            allCheckbox.checked = isAllMode;
            const allText = document.createElement('span');
            allText.className = 'column-filter-value-text';
            allText.textContent = 'All';
            allRow.appendChild(allCheckbox);
            allRow.appendChild(allText);
            allRow.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                selected[definition.key] = ['all'];
                onChange();
                renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, definition.key);
            });
            subMenu.appendChild(allRow);

            individualValues.forEach(value => {
                const row = document.createElement('label');
                row.className = 'column-filter-value-row';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isAllMode || (Array.isArray(keySelected) && keySelected.includes(value));

                const text = document.createElement('span');
                text.className = 'column-filter-value-text';
                text.textContent = value === NONE_FILTER_VALUE ? 'None' : formatFilterValueLabel(value);

                row.appendChild(checkbox);
                row.appendChild(text);

                row.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    let currentValues;
                    if (isAllMode) {
                        currentValues = [value];
                    } else {
                        currentValues = Array.from(Array.isArray(keySelected) ? keySelected : []);
                        const idx = currentValues.indexOf(value);
                        if (idx >= 0) currentValues.splice(idx, 1);
                        else currentValues.push(value);
                    }
                    if (currentValues.length === 0) {
                        selected[definition.key] = ['all'];
                    } else if (currentValues.length === individualValues.length) {
                        selected[definition.key] = ['all'];
                    } else {
                        selected[definition.key] = currentValues;
                    }
                    onChange();
                    renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, definition.key);
                });

                subMenu.appendChild(row);
            });

            item.appendChild(subMenu);
            item.addEventListener('click', () => {
                activateDefinition(definition.key);
            });
            item.addEventListener('mouseenter', () => {
                activateDefinition(definition.key);
            });
            item.addEventListener('focusin', () => {
                activateDefinition(definition.key);
            });
            menu.appendChild(item);
        });

        const clearWrap = document.createElement('div');
        clearWrap.className = 'column-filter-clear-wrap';

        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'column-filter-clear-button';
        clearButton.style.display = 'flex';
        clearButton.style.alignItems = 'center';
        clearButton.style.justifyContent = 'flex-start';
        clearButton.style.gap = '8px';
        clearButton.style.paddingLeft = '8px';
        clearButton.style.paddingRight = '8px';
        clearButton.style.textAlign = 'left';

        const iconWrap = document.createElement('span');
        iconWrap.className = 'tool-icon-wrap';
        iconWrap.style.width = '18px';
        iconWrap.style.height = '18px';
        iconWrap.style.minWidth = '18px';
        iconWrap.style.marginLeft = 'auto';
        iconWrap.style.display = 'flex';
        iconWrap.style.alignItems = 'center';
        iconWrap.style.justifyContent = 'center';
        iconWrap.innerHTML = `
            <svg class="tool-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M18 6 6 18 M6 6 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>`;

        const textSpan = document.createElement('span');
        textSpan.className = 'column-filter-clear-text';
        textSpan.textContent = 'Clear Filters';

        clearButton.appendChild(textSpan);
        clearButton.appendChild(iconWrap);

        clearButton.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            resetColumnFilterSelections(usableDefinitions, selected);
            onChange();
            renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange);
        });

        const hasAnyActive = hasActiveColumnFilters(usableDefinitions, selected);
        if (hasAnyActive) {
            clearWrap.appendChild(clearButton);
            menu.appendChild(clearWrap);
        }

        const closeMenu = () => {
            menu.classList.remove('open');
            menu.classList.remove('skip-animation');
            menu.querySelectorAll('.column-filter-item').forEach(node => node.classList.remove('active'));
            button.setAttribute('aria-expanded', 'false');
            syncCoursesModalScrollLock(false);
            syncDropdownScrollLock();
        };

        if (!menu.dataset.boundColumnFilterMenu) {
            menu.dataset.boundColumnFilterMenu = 'true';
            menu.dataset.submenuHovered = 'false';
            menu.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            menu.addEventListener('mouseover', (event) => {
                if (event.target && event.target.closest('.column-filter-submenu')) {
                    menu.dataset.submenuHovered = 'true';
                }
            });
            menu.addEventListener('mouseleave', () => {
                if (menu.dataset.submenuHovered === 'true') closeMenu();
            });
        }

        if (!button.dataset.boundColumnFilter) {
            button.dataset.boundColumnFilter = 'true';
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const isOpen = menu.classList.contains('open');
                document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(container => {
                    container.classList.remove('open');
                });
                closeAllColumnFilterMenus();
                syncDropdownScrollLock();
                if (isOpen || usableDefinitions.length === 0) return;
                menu.classList.remove('skip-animation');
                menu.classList.add('open');
                menu.dataset.submenuHovered = 'false';
                button.setAttribute('aria-expanded', 'true');
                syncCoursesModalScrollLock(true);
                syncDropdownScrollLock();
                requestAnimationFrame(() => positionColumnFilterMenu());
            });
        }
    };

    const renderSkillColumnFilter = () => {
        if (!state.isSkillsPage || !state.skillsFilterButton || !state.skillsFilterMenu) return;
        const skills = Array.isArray(state.allData?.skills) ? state.allData.skills : [];
        const definitions = [
            {
                key: 'type',
                label: 'Category',
                values: skills.map(skill => toText(skill.badge))
            },
            {
                key: 'level',
                label: 'Proficiency',
                values: skills.map(skill => toText(skill.level))
            }
        ];

        renderColumnFilterMenu(
            state.skillsFilterButton,
            state.skillsFilterMenu,
            definitions,
            state.selectedSkillColumnValues,
            () => state.filterSkills && state.filterSkills()
        );
    };

    const renderPortfolioColumnFilter = (projects) => {
        if (!state.isPortfolioPage || !state.portfolioFilterButton || !state.portfolioFilterMenu) return;
        if (!(state.currentRoute === '/videos' || state.currentRoute === '/games')) return;

        const list = Array.isArray(projects) ? projects : [];
        const definitions = [
            {
                key: 'type',
                label: 'Category',
                values: list.map(project => toText(project.badge))
            },
            {
                key: 'tools',
                label: 'Tools',
                values: list.flatMap(project => {
                    const rawTools = toText(project.tools);
                    if (!rawTools) return [''];
                    return rawTools.split(',').map(value => toText(value));
                })
            }
        ];

        if (!('type' in state.selectedPortfolioColumnValues)) state.selectedPortfolioColumnValues.type = ['all'];
        if (!('tools' in state.selectedPortfolioColumnValues)) state.selectedPortfolioColumnValues.tools = ['all'];

        renderColumnFilterMenu(
            state.portfolioFilterButton,
            state.portfolioFilterMenu,
            definitions,
            state.selectedPortfolioColumnValues,
            () => {
                const selectedByColumn = state.selectedPortfolioColumnValues || {};
                state.selectedCategories = Array.isArray(selectedByColumn.type) ? [...selectedByColumn.type] : ['all'];
                state.selectedTools = Array.isArray(selectedByColumn.tools) ? [...selectedByColumn.tools] : ['all'];
                if (!('type' in selectedByColumn)) state.selectedCategories = ['all'];
                if (!('tools' in selectedByColumn)) state.selectedTools = ['all'];
                if (state.filterCards) state.filterCards();
            }
        );
    };

    const syncTableSortButtons = (scope, sortKey, sortOrder) => {
        document.querySelectorAll(`.table-sort-header[data-sort-scope="${scope}"]`).forEach(header => {
            const isColumnActive = header.dataset.sortKey === sortKey && !!sortOrder;
            header.classList.toggle('is-active', isColumnActive);
            header.dataset.activeOrder = isColumnActive ? sortOrder : '';
            header.setAttribute('aria-pressed', isColumnActive ? 'true' : 'false');
            header.querySelectorAll('.table-sort-button').forEach(indicator => {
                const indicatorOrder = indicator.dataset.sortOrder || '';
                indicator.classList.toggle('is-active', isColumnActive && indicatorOrder === sortOrder);
            });
        });
    };

    const getDefaultSortState = (scope) => {
        if (scope === 'courses') return { sortKey: 'status', sortOrder: 'asc' };
        if (scope === 'skills') return { sortKey: 'lastUsed', sortOrder: 'desc' };
        return { sortKey: null, sortOrder: null };
    };

    const isDefaultSortState = (scope, sortKey, sortOrder) => {
        const defaultState = getDefaultSortState(scope);
        return defaultState.sortKey === sortKey && defaultState.sortOrder === sortOrder;
    };

    const getNextSortState = (scope, currentKey, currentOrder, targetKey) => {
        const defaultState = getDefaultSortState(scope);
        if (currentKey !== targetKey || !currentOrder) return { sortKey: targetKey, sortOrder: 'asc' };
        if (targetKey === defaultState.sortKey) {
            if (isDefaultSortState(scope, currentKey, currentOrder)) {
                return {
                    sortKey: targetKey,
                    sortOrder: defaultState.sortOrder === 'asc' ? 'desc' : 'asc'
                };
            }
            return defaultState;
        }
        if (currentOrder === 'asc') return { sortKey: targetKey, sortOrder: 'desc' };
        return getDefaultSortState(scope);
    };

    const bindSkillTableSortButtons = () => {
        document.querySelectorAll('.table-sort-header[data-sort-scope="skills"]').forEach(header => {
            if (header.dataset.boundSortClick === 'true') return;
            header.dataset.boundSortClick = 'true';
            const toggleSort = () => {
                const nextState = getNextSortState('skills', state.selectedSort, state.selectedOrder, header.dataset.sortKey || '');
                state.selectedSort = nextState.sortKey;
                state.selectedOrder = nextState.sortOrder;
                if (state.sortSkills) state.sortSkills();
                if (state.syncSkillSortIndicators) state.syncSkillSortIndicators();
            };
            header.addEventListener('click', () => {
                toggleSort();
            });
            header.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                toggleSort();
            });
        });
    };

    const bindCourseTableSortButtons = () => {
        document.querySelectorAll('.table-sort-header[data-sort-scope="courses"]').forEach(header => {
            if (header.dataset.boundSortClick === 'true') return;
            header.dataset.boundSortClick = 'true';
            const toggleSort = () => {
                const nextState = getNextSortState('courses', state.selectedCourseSort, state.selectedCourseOrder, header.dataset.sortKey || '');
                state.selectedCourseSort = nextState.sortKey;
                state.selectedCourseOrder = nextState.sortOrder;
                applyCoursesFilterAndSort();
                if (state.syncCourseSortIndicators) state.syncCourseSortIndicators();
            };
            header.addEventListener('click', () => {
                toggleSort();
            });
            header.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                toggleSort();
            });
        });
    };

    const normalizeCourses = (rows) => {
        return (Array.isArray(rows) ? rows : []).map((row, index) => {
            const id = toText(row.id || row.courseid);
            const name = toText(row.name);
            const school = toText(row.school);
            const type = toText(row.type);
            const info = toText(row.info);
            const status = toText(row.status);
            const grade = toText(row.grade);
            const credits = toText(row.creditsearned || row.credits || row.creditsEarned);
            const completionYear = toText(row.completionyear || row.completionYear || row.year || row.completion);
            return { id, name, school, type, info, status, completionYear, grade, credits, originalIndex: index };
        }).filter(course => course.id || course.name || course.school || course.type || course.status || course.grade || course.credits || course.info);
    };

    const sortCourses = (courses) => {
        const sortKey = state.selectedCourseSort || 'id';
        const sortOrder = state.selectedCourseOrder || 'asc';
        const sorted = [...courses];
        if (!state.selectedCourseSort || !state.selectedCourseOrder) {
            sorted.sort((a, b) => (a.originalIndex || 0) - (b.originalIndex || 0));
            return sorted;
        }
        const statusOrder = {
            completed: 0,
            'in progress': 1,
            upcoming: 2
        };

        const valueFor = (course, key) => {
            if (key === 'status') {
                const normalized = toText(course.status).toLowerCase();
                return normalized in statusOrder ? statusOrder[normalized] : Number.MAX_SAFE_INTEGER;
            }
            if (key === 'credits') {
                const numeric = Number.parseFloat(toText(course.credits || ''));
                return Number.isFinite(numeric) ? numeric : null;
            }
            if (key === 'completionyear' || key === 'completionYear') {
                const numeric = Number.parseInt(toText(course.completionYear || course.completionyear || ''), 10);
                return Number.isFinite(numeric) ? numeric : null;
            }
            return toText(course[key]).toLowerCase();
        };

        sorted.sort((a, b) => {
            const aValue = valueFor(a, sortKey);
            const bValue = valueFor(b, sortKey);

            const isMissing = (v) => v === null || v === undefined || (typeof v === 'string' && String(v).trim() === '');

            if (isMissing(aValue) && isMissing(bValue)) return (a.name || '').localeCompare(b.name || '');
            if (isMissing(aValue)) return 1;
            if (isMissing(bValue)) return -1;

            if (aValue === bValue) return (a.name || '').localeCompare(b.name || '');

            if (sortOrder === 'desc') return aValue > bValue ? -1 : 1;
            return aValue < bValue ? -1 : 1;
        });

        return sorted;
    };

    const getVisibleCourseIndexes = () => {
        return state.filteredCourses.map((_, index) => index);
    };

    const getCourseStatusBadgeClass = (status) => {
        const value = toText(status).toLowerCase();
        if (value === 'completed') return 'proficiency-beginner';
        if (value === 'in progress') return 'proficiency-intermediate';
        if (value === 'upcoming') return 'proficiency-advanced';
        return 'proficiency-unknown';
    };

    const getCourseGradeBadgeClass = (grade) => {
        const value = toText(grade).toUpperCase();
        if (!value) return 'proficiency-unknown';
        if (value.startsWith('A') || value === 'P' || value === 'CR') return 'proficiency-beginner';
        if (value.startsWith('B') || value.startsWith('C') || value === 'IP') return 'proficiency-intermediate';
        return 'proficiency-advanced';
    };

    const buildCourseBadge = (value, badgeClass) => {
        const label = toText(value) || '-';
        if (label === '-') return `<span style="color:#8b949e;">-</span>`;
        return `<span class="proficiency-badge ${badgeClass}">${escapeHtml(label)}</span>`;
    };

    const populateCoursesModal = (index) => {
        if (!state.filteredCourses.length || index < 0 || index >= state.filteredCourses.length) return;
        state.currentCourseIndex = index;
        const course = state.filteredCourses[index];

        if (state.coursesModalTitle) state.coursesModalTitle.textContent = course.name || 'Course Details';
        if (state.coursesModalId) state.coursesModalId.textContent = course.id || '-';
        if (state.coursesModalSchool) state.coursesModalSchool.textContent = course.school || '-';
        if (state.coursesModalType) state.coursesModalType.textContent = course.type || '-';
        if (state.coursesModalStatus) state.coursesModalStatus.innerHTML = buildCourseBadge(course.status || '-', getCourseStatusBadgeClass(course.status));
        if (state.coursesModalGrade) state.coursesModalGrade.innerHTML = buildCourseBadge(course.grade || '-', getCourseGradeBadgeClass(course.grade));
        if (state.coursesModalCredits) {
            if (course.credits) {
                state.coursesModalCredits.textContent = course.credits;
                state.coursesModalCredits.style.color = '';
            } else {
                state.coursesModalCredits.textContent = '-';
                state.coursesModalCredits.style.color = '#8b949e';
            }
        }
        if (state.coursesModalYear) state.coursesModalYear.textContent = course.completionYear || course.completionyear || '-';
        if (state.coursesModalInfo) state.coursesModalInfo.textContent = course.info || 'No course information available.';
        updateCoursesModalNavState();
    };

    const updateCoursesModalNavState = () => {
        const canNavigate = state.filteredCourses.length > 1;
        if (state.coursesModalPrev) {
            state.coursesModalPrev.style.display = canNavigate ? '' : 'none';
            state.coursesModalPrev.disabled = !canNavigate;
        }
        if (state.coursesModalNext) {
            state.coursesModalNext.style.display = canNavigate ? '' : 'none';
            state.coursesModalNext.disabled = !canNavigate;
        }
        const content = state.coursesModal ? state.coursesModal.querySelector('.courses-modal-content') : null;
        if (content) {
            content.classList.toggle('no-side-padding', !canNavigate);
        }
    };

    const openCoursesModal = (index) => {
        if (!state.coursesModal || !state.filteredCourses.length) return;
        if (index < 0 || index >= state.filteredCourses.length) return;

        populateCoursesModal(index);
        updateCoursesModalNavState();

        if (state.coursesModal._closeTimer) {
            clearTimeout(state.coursesModal._closeTimer);
            state.coursesModal._closeTimer = null;
        }

        state.coursesModal.style.display = 'flex';
        state.coursesModal.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => {
            if (state.coursesModal) state.coursesModal.classList.add('open');
        });
        syncCoursesModalScrollLock(true);
    };

    const closeCoursesModal = () => {
        if (!state.coursesModal) return;
        state.coursesModal.classList.remove('open');
        state.coursesModal.setAttribute('aria-hidden', 'true');
        if (state.coursesModal._closeTimer) clearTimeout(state.coursesModal._closeTimer);
        state.coursesModal._closeTimer = setTimeout(() => {
            if (state.coursesModal) state.coursesModal.style.display = 'none';
            syncCoursesModalScrollLock(false);
        }, 190);
    };

    const navigateCoursesModal = (delta) => {
        const visibleIndexes = getVisibleCourseIndexes();
        if (visibleIndexes.length <= 1 || state.currentCourseIndex < 0) return;
        const nextIndex = (state.currentCourseIndex + delta + visibleIndexes.length) % visibleIndexes.length;
        const body = state.coursesModal?.querySelector('.courses-modal-body');
        const titleWrap = state.coursesModal?.querySelector('.modal-header > div');

        if (!body) {
            openCoursesModal(nextIndex);
            return;
        }

        const outClass = delta > 0 ? 'courses-swap-out-next' : 'courses-swap-out-prev';
        const inClass = delta > 0 ? 'courses-swap-in-next' : 'courses-swap-in-prev';
        const transitionTargets = [titleWrap, body].filter(Boolean);

        transitionTargets.forEach(target => {
            target.classList.remove('courses-swap-out-next', 'courses-swap-out-prev', 'courses-swap-in-next', 'courses-swap-in-prev');
            target.classList.add(outClass);
        });

        setTimeout(() => {
            populateCoursesModal(nextIndex);
            transitionTargets.forEach(target => {
                target.classList.remove(outClass);
                target.classList.add(inClass);
            });
            setTimeout(() => {
                transitionTargets.forEach(target => {
                    target.classList.remove(inClass);
                });
            }, 170);
        }, 140);
    };

    const renderCoursesTable = () => {
        if (!state.coursesTableBody) return;
        const courses = state.filteredCourses;

        if (!courses.length) {
            state.coursesTableBody.innerHTML = '<tr><td colspan="8" class="courses-loading-row">No matching courses found.</td></tr>';
            const statusEl = document.getElementById('courses-search-status');
            if (statusEl) {
                const rawQuery = state.courseSearchQuery ? state.courseSearchQuery.trim() : '';
                if (rawQuery) {
                    const safe = rawQuery.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    statusEl.classList.add('visible');
                    statusEl.innerHTML = `Showing 0 results for "<span style="color:#58a6ff;">${safe}</span>"`;
                } else {
                    statusEl.classList.remove('visible');
                    statusEl.innerHTML = '';
                }
            }
            return;
        }

        state.coursesTableBody.innerHTML = courses.map((course, index) => {
            const statusBadge = buildCourseBadge(course.status || '-', getCourseStatusBadgeClass(course.status));
            const gradeBadge = buildCourseBadge(course.grade || '-', getCourseGradeBadgeClass(course.grade));
            return `
                <tr class="course-row" data-course-index="${index}">
                    <td>${escapeHtml(course.id || '-')}</td>
                    <td>${escapeHtml(course.name || '-')}</td>
                    <td>${escapeHtml(course.school || '-')}</td>
                    <td>${escapeHtml(course.type || '-')}</td>
                    <td>${statusBadge}</td>
                    <td>${course.credits ? escapeHtml(course.credits) : '<span style="color:#8b949e;">-</span>'}</td>
                    <td>${course.completionYear ? escapeHtml(course.completionYear) : '<span style="color:#8b949e;">-</span>'}</td>
                    <td>${gradeBadge}</td>
                </tr>`;
        }).join('');

        state.coursesTableBody.querySelectorAll('.course-row').forEach(row => {
            row.addEventListener('click', () => {
                const index = Number.parseInt(row.getAttribute('data-course-index') || '-1', 10);
                if (Number.isFinite(index) && index >= 0) openCoursesModal(index);
            });
        });

        const statusEl = document.getElementById('courses-search-status');
        if (statusEl) {
            const rawQuery = state.courseSearchQuery ? state.courseSearchQuery.trim() : '';
            if (rawQuery) {
                const safe = rawQuery.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                statusEl.classList.add('visible');
                statusEl.innerHTML = `Showing ${courses.length} ${courses.length === 1 ? 'result' : 'results'} for "<span style="color:#58a6ff;">${safe}</span>"`;
            } else {
                statusEl.classList.remove('visible');
                statusEl.innerHTML = '';
            }
        }

        if (state.renderer) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const table = document.getElementById('courses-table');
                    const shell = table ? table.closest('.courses-table-shell') : null;
                    if (table && shell) state.renderer.fitTableColumns(table, shell, { floorMin: 90 });
                }, 0);
            });
        }
    };

    const applyCoursesFilterAndSort = () => {
        const courses = normalizeCourses(state.allData?.Courses || []);
        const selectedByColumn = state.selectedCourseColumnValues || {};
        const query = toText(state.courseSearchQuery).toLowerCase();

        const filtered = courses.filter(course => {
            const matchesColumn = (key, courseValue) => {
                const values = selectedByColumn[key];
                if (values === undefined) return true;
                if (Array.isArray(values) && values.includes('all')) return true;
                if (!Array.isArray(values) || values.length === 0) return false;
                const normalizedValue = toText(courseValue) || NONE_FILTER_VALUE;
                return values.includes(normalizedValue);
            };
            if (!matchesColumn('school', course.school)) return false;
            if (!matchesColumn('type', course.type)) return false;
            if (!matchesColumn('status', course.status)) return false;
            if (!matchesColumn('completionYear', course.completionYear)) return false;
            if (!matchesColumn('grade', course.grade)) return false;

            if (!query) return true;
            const searchBlob = `${course.id} ${course.name} ${course.school} ${course.type} ${course.info} ${course.status} ${course.completionYear || ''} ${course.grade} ${course.credits}`.toLowerCase();
            return searchBlob.includes(query);
        });

        state.filteredCourses = sortCourses(filtered);
        if (state.currentCourseIndex >= state.filteredCourses.length) state.currentCourseIndex = state.filteredCourses.length - 1;
        if (state.coursesModal?.style.display === 'flex') {
            if (!state.filteredCourses.length || state.currentCourseIndex < 0) {
                closeCoursesModal();
            } else {
                populateCoursesModal(state.currentCourseIndex);
            }
        }
        renderCoursesTable();
    };

    const setupCoursesControls = () => {
        if (!state.isCoursesPage) return;

        bindCourseTableSortButtons();
        if (state.syncCourseSortIndicators) state.syncCourseSortIndicators();

        if (state.coursesSearchInput && !state.coursesSearchInput.dataset.boundCoursesSearch) {
            state.coursesSearchInput.dataset.boundCoursesSearch = 'true';
            const coursesClearBtn = document.getElementById('courses-search-clear');
            const updateClearButton = () => {
                if (!coursesClearBtn) return;
                coursesClearBtn.classList.toggle('visible', Boolean(state.coursesSearchInput.value && String(state.coursesSearchInput.value).trim().length));
            };
            state.coursesSearchInput.addEventListener('input', () => {
                updateClearButton();
                state.courseSearchQuery = state.coursesSearchInput.value || '';
                if (state.coursesSearchInput._courseSearchDebounce) {
                    clearTimeout(state.coursesSearchInput._courseSearchDebounce);
                }
                state.coursesSearchInput._courseSearchDebounce = setTimeout(() => {
                    applyCoursesFilterAndSort();
                }, 150);
            });
            state.coursesSearchInput.value = state.courseSearchQuery || '';
            if (coursesClearBtn) {
                coursesClearBtn.addEventListener('click', () => {
                    state.coursesSearchInput.value = '';
                    state.courseSearchQuery = '';
                    updateClearButton();
                    applyCoursesFilterAndSort();
                    state.coursesSearchInput.focus();
                });
            }
            updateClearButton();
        }

        if (state.coursesFilterButton && state.coursesFilterMenu) {
            const courses = normalizeCourses(state.allData?.Courses || []);
            const definitions = [
                {
                    key: 'school',
                    label: 'School',
                    values: courses.map(course => course.school)
                },
                {
                    key: 'type',
                    label: 'Type',
                    values: courses.map(course => course.type)
                },
                {
                    key: 'status',
                    label: 'Status',
                    values: courses.map(course => course.status)
                },
                {
                    key: 'completionYear',
                    label: 'Completion Year',
                    values: courses.map(course => course.completionYear)
                },
                {
                    key: 'grade',
                    label: 'Grade',
                    values: courses.map(course => course.grade)
                }
            ];

            renderColumnFilterMenu(
                state.coursesFilterButton,
                state.coursesFilterMenu,
                definitions,
                state.selectedCourseColumnValues,
                applyCoursesFilterAndSort
            );
        }

        if (!state.coursesModalClose?.dataset.boundCoursesModal) {
            if (state.coursesModalClose) {
                state.coursesModalClose.dataset.boundCoursesModal = 'true';
                state.coursesModalClose.addEventListener('click', closeCoursesModal);
            }
            if (state.coursesModalPrev) {
                state.coursesModalPrev.dataset.boundCoursesModal = 'true';
                state.coursesModalPrev.addEventListener('click', (event) => {
                    event.stopPropagation();
                    navigateCoursesModal(-1);
                });
            }
            if (state.coursesModalNext) {
                state.coursesModalNext.dataset.boundCoursesModal = 'true';
                state.coursesModalNext.addEventListener('click', (event) => {
                    event.stopPropagation();
                    navigateCoursesModal(1);
                });
            }
        }
    };

    const renderCourses = () => {
        if (!state.isCoursesPage || !state.coursesTableBody) return;
        renderCoursesDashboard();
        setupCoursesControls();
        applyCoursesFilterAndSort();
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
            state.prevBtn.onclick = (e) => {
                e.stopPropagation();
                state.modalManager?.navigateItem(-1);
            };
        }
        if (state.nextBtn) {
            state.nextBtn.onclick = (e) => {
                e.stopPropagation();
                state.modalManager?.navigateItem(1);
            };
        }
    };

    const syncDropdownScrollLock = () => {
        const hasOpenDropdown = !!document.querySelector('.custom-select-container.open, .multi-select-container.open, .column-filter-menu.open');
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
                } else if (state.coursesModal && state.coursesModal.style.display === 'flex') {
                    if (state.filteredCourses.length > 1) {
                        if (e.key === 'ArrowLeft') navigateCoursesModal(-1);
                        if (e.key === 'ArrowRight') navigateCoursesModal(1);
                    }
                    if (e.key === 'Escape') closeCoursesModal();
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
                const clickedSelect = !!e.target.closest('.custom-select-container, .multi-select-container');
                const clickedColumnFilter = !!e.target.closest('.column-filter-menu, .filter-icon-button');
                if (!clickedSelect) {
                    document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
                }
                if (!clickedColumnFilter) {
                    closeAllColumnFilterMenus();
                }
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
                } else if (event.target === state.coursesModal && modalMousedownTarget === state.coursesModal) {
                    closeCoursesModal();
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
        if (route === '/courses' && !state.allData.Courses) sheetsNeeded.push('Courses');
        if ((route === '/' || route === '/bio') && !state.allData.School) sheetsNeeded.push('School');
        if ((route === '/' || route === '/bio') && !state.allData.Courses) sheetsNeeded.push('Courses');
        if (route === '/achievements') {
            if (!state.allData.videos) sheetsNeeded.push('videos');
            if (!state.allData.skills) sheetsNeeded.push('skills');
            if (!state.allData.Achievements) sheetsNeeded.push('Achievements');
            if (!state.allData.School) sheetsNeeded.push('School');
            if (!state.allData.Courses) sheetsNeeded.push('Courses');
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

            if (state.currentRoute === '/courses') {
                const allCoursesCount = normalizeCourses(data.Courses || []).length;
                setStoredCount(state.skeletonKey, allCoursesCount);
                renderCourses();
            }

            if (state.portfolioGrid) {
                const pageType = state.currentRoute === '/games' ? 'games' : 'videos';
                const projectData = data[pageType] || [];
                setStoredCount(state.skeletonKey, projectData.length);

                if (!isCached && (!state.didPrimeSkeletons || state.primedSkeletonTarget !== 'portfolio' || state.primedSkeletonCount !== projectData.length)) {
                    state.renderer.showSkeletons(state.portfolioGrid, projectData.length);
                }

                if (projectData.length === 0) {
                    const projectLabel = pageType === 'games' ? 'game projects' : 'video projects';
                    state.portfolioGrid.innerHTML = `<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 40px;">No matching ${projectLabel} found.</p>`;
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
                            renderPortfolioColumnFilter(projectData);
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
                    bindSkillTableSortButtons();
                    if (state.syncSkillSortIndicators) state.syncSkillSortIndicators();
                    renderSkillColumnFilter();
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
        state.isCoursesPage = route === '/courses';
        const isGamesOrVideosPage = route === '/videos' || route === '/games';
        if (state.portfolioFilterGroup) state.portfolioFilterGroup.style.display = isGamesOrVideosPage ? 'flex' : 'none';
        if (state.typeSelectContainer && state.typeSelectContainer.parentElement) state.typeSelectContainer.parentElement.style.display = isGamesOrVideosPage ? 'none' : 'flex';
        if (state.toolSelectContainer && state.toolSelectContainer.parentElement) state.toolSelectContainer.parentElement.style.display = isGamesOrVideosPage ? 'none' : 'flex';
        if (state.isSkillsPage) state.selectedSort = 'lastUsed';
        else if (state.isPortfolioPage) state.selectedSort = 'date';

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
        state.syncSkillSortIndicators = () => syncTableSortButtons('skills', state.selectedSort, state.selectedOrder);
        state.syncCourseSortIndicators = () => syncTableSortButtons('courses', state.selectedCourseSort, state.selectedCourseOrder);

        if (state.isSkillsPage || state.isPortfolioPage) {
            state.controlsManager.initControlSkeletons();
            state.controlsManager.renderStaticControls();
        }
        primeSkeletons();
        bindModalButtons();

        const token = ++state.routeToken;
        applyDataForRoute(token);
    };

    const loadRoute = async (route, search = '', options = {}) => {
        const {
            push = true,
            scroll = true,
            historyUrl = null
        } = options;
        const routeInfo = routes[route] || routes['/'];
        const root = document.getElementById('page-root');
        if (!root) return;

        document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
        document.body.classList.remove('dropdown-scroll-lock');
        document.documentElement.classList.remove('dropdown-scroll-lock');

        if (shouldSkipRouteLoad(route, search, root)) return;

        const finalHistoryUrl = historyUrl !== null ? historyUrl : buildUrl(route, search);

        if (push) {
            window.history.pushState({ route, search }, '', finalHistoryUrl);
        } else {
            window.history.replaceState({ route, search }, '', finalHistoryUrl);
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
            const updateDOM = () => {
                root.innerHTML = '';
                root.replaceChildren(...nextRoot.childNodes);
                initializePage(route);
            };

            if (!initialRouteHydrated) {
                updateDOM();
                initialRouteHydrated = true;
            } else {
                await runRouteCrossfade(root, updateDOM);
            }
        } catch (err) {
            if (state.routeToken !== token) return;
            const applyErrorDOM = () => {
                root.innerHTML = '';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'page-intro';
                errorDiv.innerHTML = '<h2>Page not found</h2><p>The page could not be loaded.</p>';
                root.appendChild(errorDiv);
                initializePage('/');
            };

            if (!initialRouteHydrated) {
                applyErrorDOM();
                initialRouteHydrated = true;
            } else {
                await runRouteCrossfade(root, applyErrorDOM);
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
            ${(route === '/courses' || route === '/technical') ? `
            <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-top:24px; margin-bottom:18px;">
                <div class="skeleton-element" style="flex:1 1 320px; min-width:240px; height: 36px; border-radius: 10px;"></div>
                <div class="skeleton-element" style="width: 150px; height: 36px; border-radius: 10px;"></div>
                <div class="skeleton-element" style="width: 164px; height: 36px; border-radius: 10px;"></div>
                <div class="skeleton-element" style="width: 36px; height: 36px; border-radius: 10px;"></div>
            </div>
            <div class="courses-table-shell" style="margin-top:0;">
                <table class="courses-table" style="min-width:820px;">
                    <thead>
                        <tr>
                            <th><div class="skeleton-element" style="width:36px; height:12px; border-radius:999px;"></div></th>
                            <th><div class="skeleton-element" style="width:76px; height:12px; border-radius:999px;"></div></th>
                            <th><div class="skeleton-element" style="width:64px; height:12px; border-radius:999px;"></div></th>
                            <th><div class="skeleton-element" style="width:52px; height:12px; border-radius:999px;"></div></th>
                            <th><div class="skeleton-element" style="width:62px; height:12px; border-radius:999px;"></div></th>
                            <th><div class="skeleton-element" style="width:54px; height:12px; border-radius:999px;"></div></th>
                            <th><div class="skeleton-element" style="width:96px; height:12px; border-radius:999px;"></div></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><div class="skeleton-element" style="width:44px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:180px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:120px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:96px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:88px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:70px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:64px; height:14px; border-radius:999px;"></div></td>
                        </tr>
                        <tr>
                            <td><div class="skeleton-element" style="width:44px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:220px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:138px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:86px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:102px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:76px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:58px; height:14px; border-radius:999px;"></div></td>
                        </tr>
                        <tr>
                            <td><div class="skeleton-element" style="width:44px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:194px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:114px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:104px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:92px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:68px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:60px; height:14px; border-radius:999px;"></div></td>
                        </tr>
                        <tr>
                            <td><div class="skeleton-element" style="width:44px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:208px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:126px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:98px; height:14px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:96px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:72px; height:18px; border-radius:999px;"></div></td>
                            <td><div class="skeleton-element" style="width:62px; height:14px; border-radius:999px;"></div></td>
                        </tr>
                    </tbody>
                </table>
            </div>` : `
            <div class="skeleton-element" style="width: 100%; height: 420px; border-radius: 10px; margin-top: 16px;"></div>`}
        `;
    };

    const injectSharedHeaderFooter = async () => {
        const headerEl = document.getElementById('shared-header');
        const footerEl = document.getElementById('shared-footer');

        const tasks = [];
        if (headerEl && !headerEl.hasChildNodes()) {
            tasks.push(getFragmentHtml('html/nav.html').then(html => {
                headerEl.innerHTML = html;
            }).catch(() => { }));
        }
        if (footerEl && !footerEl.hasChildNodes()) {
            tasks.push(getFragmentHtml('html/footer.html').then(html => {
                footerEl.innerHTML = html;
            }).catch(() => { }));
        }

        let sharedModals = document.getElementById('shared-modals-container');
        if (!sharedModals) {
            sharedModals = document.createElement('div');
            sharedModals.id = 'shared-modals-container';
            document.body.appendChild(sharedModals);
            tasks.push(getFragmentHtml('html/fragments/modals.html').then(html => {
                sharedModals.innerHTML = html;
            }).catch(() => { }));
        }

        await Promise.all(tasks);
    };

    await injectSharedHeaderFooter();

    updateNavLinks();

    const setupMobileNav = () => {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        const contactLink = document.getElementById('contact-link');

        if (toggleBtn && navLinks) {
            const closeMenu = () => {
                toggleBtn.classList.remove('open');
                navLinks.classList.remove('mobile-menu-open');
                document.body.classList.remove('mobile-nav-locked');
                document.documentElement.classList.remove('scroll-lock');
            };

            const openMenu = () => {
                toggleBtn.classList.add('open');
                navLinks.classList.add('mobile-menu-open');
                document.body.classList.add('mobile-nav-locked');
                document.documentElement.classList.add('scroll-lock');
            };

            toggleBtn.addEventListener('click', () => {
                const willOpen = !navLinks.classList.contains('mobile-menu-open');
                if (willOpen) openMenu();
                else closeMenu();
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    closeMenu();
                });
            });

            document.addEventListener('click', (e) => {
                if (!navLinks.classList.contains('mobile-menu-open')) return;
                const target = e.target;
                if (toggleBtn.contains(target)) return;
                if (navLinks.contains(target)) return;
                closeMenu();
            }, { capture: true });

            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (!navLinks.classList.contains('mobile-menu-open')) return;
                closeMenu();
            });
        }

        if (contactLink) {
            contactLink.addEventListener('click', (e) => {
                e.preventDefault();
                const footer = document.querySelector('.page-footer');
                if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                if (toggleBtn && navLinks) {
                    toggleBtn.classList.remove('open');
                    navLinks.classList.remove('mobile-menu-open');
                    document.body.classList.remove('mobile-nav-locked');
                    document.documentElement.classList.remove('scroll-lock');
                }
            });
        }
    };
    setupMobileNav();

    updateNavActive(resolveRoute(window.location.pathname));
    ensureGlobalEvents();

    document.addEventListener('click', async (e) => {
        const mailtoLink = e.target.closest('a[href^="mailto:"]');
        if (mailtoLink) {
            e.preventDefault();
            const href = mailtoLink.getAttribute('href');
            const confirmed = await showExternalLinkModal(href, 'Email Me', 'Contact', 'Are you sure you want to send an email?');
            if (confirmed) {
                window.location.href = href;
            }
        }
    });

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
