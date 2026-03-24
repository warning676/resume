document.addEventListener('DOMContentLoaded', async () => {
    let initialRouteHydrated = false;
    let portfolioGridResizeObserver = null;
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
        coursesModalProgrammingLanguagesLabel: null,
        coursesModalProgrammingLanguagesContainer: null,
        coursesModalFeaturedSection: null,
        coursesModalFeaturedDesc: null,
        coursesModalFeaturedLink: null,
        coursesModalFeaturedLangWrap: null,
        coursesModalFeaturedLanguages: null,
        coursesModalFeaturedProjectLangLabel: null,
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
        hiddenCourseColumns: {},
        hiddenSkillColumns: {},
        filteredCourses: [],
        coursesModalUseStandaloneList: false,
        coursesModalStandaloneList: null,
        coursesModalClosing: false,
        disableCourseNavigationFromSkillModal: false,
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
        skeletonKey: null,
        coursesProgrammingLanguageIconsPreloaded: false,
        coursesLanguageIconsPreloadPromise: null
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
        state.hiddenCourseColumns = {};
        state.hiddenSkillColumns = {};
        state.filteredCourses = [];
        state.coursesModalUseStandaloneList = false;
        state.coursesModalStandaloneList = null;
        state.coursesModalClosing = false;
        state.disableCourseNavigationFromSkillModal = false;
        if (state.coursesModal) state.coursesModal.classList.remove('courses-modal-over-modal');
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
        const shell = state.coursesTableBody?.closest('.courses-table-shell');
        if (shell) shell.style.minHeight = '';
        state.coursesProgrammingLanguageIconsPreloaded = false;
        state.coursesLanguageIconsPreloadPromise = null;
        const skillsShell = document.querySelector('.courses-table-shell.skills-table-shell');
        if (skillsShell) skillsShell.style.minHeight = '';
        if (portfolioGridResizeObserver) {
            portfolioGridResizeObserver.disconnect();
            portfolioGridResizeObserver = null;
        }
        if (state.portfolioGrid) state.portfolioGrid.style.minHeight = '';
    };

    const lockTableShellHeight = (shell) => {
        if (!shell) return;
        const currentHeight = shell.getBoundingClientRect().height;
        if (!Number.isFinite(currentHeight) || currentHeight <= 0) return;
        const currentMin = Number.parseFloat(shell.style.minHeight || '0');
        const nextMin = Math.ceil(currentHeight);
        if (!Number.isFinite(currentMin) || nextMin > currentMin) shell.style.minHeight = `${nextMin}px`;
    };

    const ensurePortfolioGridResizeObserver = () => {
        if (portfolioGridResizeObserver) {
            portfolioGridResizeObserver.disconnect();
            portfolioGridResizeObserver = null;
        }
        const grid = state.portfolioGrid;
        if (!grid || !state.isPortfolioPage) return;
        portfolioGridResizeObserver = new ResizeObserver(() => {
            if (state.lockPortfolioGridHeight) state.lockPortfolioGridHeight();
        });
        portfolioGridResizeObserver.observe(grid);
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
        state.coursesModalProgrammingLanguagesLabel = document.getElementById('courses-modal-programming-languages-label');
        state.coursesModalProgrammingLanguagesContainer = document.getElementById('courses-modal-programming-languages');
        state.coursesModalYear = document.getElementById('courses-modal-year');
        state.coursesModalFeaturedSection = document.getElementById('courses-modal-featured-section');
        state.coursesModalFeaturedDesc = document.getElementById('courses-modal-featured-desc');
        state.coursesModalFeaturedLink = document.getElementById('courses-modal-featured-link');
        state.coursesModalFeaturedLangWrap = document.getElementById('courses-modal-featured-lang-wrap');
        state.coursesModalFeaturedLanguages = document.getElementById('courses-modal-featured-languages');
        state.coursesModalFeaturedProjectLangLabel = document.getElementById('courses-modal-featured-project-lang-label');
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

        const esc = (v) => String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const awards = state.filmFestivalAwards;
        if (!awards || Object.keys(awards).length === 0) {
            container.innerHTML = '<p style="color: #8b949e;">No awards found.</p>';
            return;
        }

        const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const videos = state.allData?.videos || [];

        const entries = Object.entries(awards)
            .map(([projectName, projectAwards]) => {
                if (!Array.isArray(projectAwards) || !projectAwards.length) return null;
                const nName = normalize(projectName);
                const project = videos.find(v => normalize(v.name) === nName)
                    || videos.find(v => normalize(v.name).includes(nName))
                    || videos.find(v => nName.includes(normalize(v.name)));
                if (!project) return null;
                return { project, projectAwards };
            })
            .filter(Boolean);

        if (!entries.length) {
            container.innerHTML = '<p style="color: #8b949e;">No awards found.</p>';
            return;
        }

        const awardTime = (a) => Utils.parseMonthYearToTime((a && a.date) || '');
        entries.forEach((e) => {
            e.projectAwards = [...e.projectAwards].sort((x, y) => awardTime(y) - awardTime(x));
        });
        entries.sort((a, b) => {
            const am = Math.max(0, ...a.projectAwards.map(awardTime));
            const bm = Math.max(0, ...b.projectAwards.map(awardTime));
            return bm - am;
        });

        const awardVideos = entries.map((e) => e.project);
        const fixPath = (p) => (state.renderer && typeof state.renderer.fixImagePath === 'function')
            ? state.renderer.fixImagePath(p)
            : p;

        container.innerHTML = '';

        entries.forEach(({ project, projectAwards }) => {
            let thumbSrc = project.resolvedThumb || (project.gallery && project.gallery[0]) || '';
            const youtubeID = Utils.extractYouTubeID(project.youtube || '');
            const hasValidYoutube = youtubeID && youtubeID.trim() !== '' && youtubeID !== 'YOUTUBE_ID_HERE';
            if (hasValidYoutube) {
                thumbSrc = project.resolvedThumb || `https://i.ytimg.com/vi/${youtubeID}/hqdefault.jpg`;
            } else {
                thumbSrc = project.resolvedThumb || fixPath(thumbSrc);
            }

            const awardLines = projectAwards.map((a) => {
                const locationParts = String(a.location || '').split('|').map((part) => part.trim());
                const school = locationParts[0] || '';
                const festival = locationParts[1] || '';
                let locHtml = '';
                if (festival || school) {
                    locHtml = '<div class="modal-award-loc">';
                    if (festival) locHtml += `<span class="modal-award-loc-festival">${esc(festival)}</span>`;
                    if (school) locHtml += `<span class="modal-award-loc-school">${esc(school)}</span>`;
                    locHtml += '</div>';
                }
                return `<li class="festival-award-line"><div class="festival-award-line-body"><span class="festival-award-prize">${esc(a.award)}</span>${locHtml}</div><span class="festival-award-date">${esc(a.date)}</span></li>`;
            }).join('');

            const card = document.createElement('div');
            card.className = 'portfolio-card festival-award-card';
            card.setAttribute('data-name', project.name || '');
            card.setAttribute('data-date', project.date || '');
            card.setAttribute('data-info', project.info || '');
            card.setAttribute('data-tools', project.tools || '');
            card.setAttribute('data-youtube', project.youtube || '');
            card.setAttribute('data-type', project.badge || '');
            card.setAttribute('data-badge', project.badge || '');
            card.setAttribute('data-gallery', project.gallery ? project.gallery.join(', ') : '');

            card.innerHTML = `
                <div class="card-thumb">
                    <img alt="${esc(project.name || '')}" loading="lazy">
                </div>
                <div class="card-content">
                    <div class="card-info">
                        <h3>${esc(project.name || '')}</h3>
                        <ul class="festival-award-list">${awardLines}</ul>
                    </div>
                </div>`;

            const imgElement = card.querySelector('img');
            if (imgElement) {
                imgElement.src = thumbSrc;
                if (hasValidYoutube) {
                    imgElement.onload = function () {
                        if (this.naturalWidth === 120 && this.naturalHeight === 90) {
                            this.style.opacity = '0.3';
                            this.style.filter = 'blur(2px)';
                        }
                    };
                    imgElement.onerror = function () {
                        this.style.opacity = '0.3';
                    };
                }
            }

            card.addEventListener('click', () => {
                state.achievementVideos = awardVideos;
                state.currentAchievementVideoIndex = awardVideos.indexOf(project);
                state.showModalNavArrows = awardVideos.length > 1;
                if (state.modalManager) {
                    state.modalManager.openModalForItem(project, 'videos');
                }
            });

            container.appendChild(card);
        });
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
            const date = (row?.date || '').toString().trim();
            const item = { name, link, info, date };
            const isSNHU = collegeSchoolNames.some(schoolName => school.includes(schoolName));
            const isERHS = highSchoolNames.some(schoolName => school.includes(schoolName));

            if (type.includes('president') && (isSNHU || !school)) grouped.presidents.push({ ...item, category: "President's List" });
            else if (type.includes('honor') && (isSNHU || !school)) grouped.honorRoll.push({ ...item, category: 'Honor Roll' });
            else if (type.includes('nomination') && (isERHS || !school)) grouped.nominations.push({ ...item, category: 'Nominations' });
        });

        const meritVerifyModalExtra = 'The destination is SNHU Merit Pages, where the official recognition badge or listing for this term is displayed.';

        const renderInlineItems = (container, items, textColor = '#58a6ff', extraOptions) => {
            const opts = extraOptions && typeof extraOptions === 'object' ? extraOptions : {};
            const meritExtra = opts.meritExtra;
            const omitDescription = opts.omitDescription === true;
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
                    anchor.innerHTML = `${item.name} ${Utils.lucideChevronRightSvg({ size: 14 })}`;
                    anchor.addEventListener('click', (e) => {
                        e.preventDefault();
                        let modalInfo = '';
                        if (meritExtra) {
                            modalInfo = [String(item.info || '').trim(), meritExtra].filter(Boolean).join('\n\n');
                        } else {
                            modalInfo = item.info || '';
                        }
                        openExternalLinkWithPrompt(
                            item.link,
                            item.name || 'External Link',
                            item.category || 'Achievement',
                            modalInfo || meritExtra || ''
                        );
                    });
                    wrapper.appendChild(anchor);
                } else {
                    const plain = document.createElement('span');
                    plain.style.color = '#e1e4e8';
                    plain.style.fontSize = '0.9rem';
                    plain.textContent = item.name;
                    wrapper.appendChild(plain);
                }

                if (!omitDescription && item.info) {
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

        const sortAchievementTermsNewestFirst = (items) => {
            items.sort(
                (a, b) =>
                    Utils.parseAchievementRecencyMs(b.name, b.date) - Utils.parseAchievementRecencyMs(a.name, a.date)
            );
        };
        sortAchievementTermsNewestFirst(grouped.presidents);
        sortAchievementTermsNewestFirst(grouped.honorRoll);

        renderInlineItems(presidentsContainer, grouped.presidents, '#58a6ff', {
            meritExtra: meritVerifyModalExtra,
            omitDescription: true
        });
        renderInlineItems(honorRollContainer, grouped.honorRoll, '#58a6ff', {
            meritExtra: meritVerifyModalExtra,
            omitDescription: true
        });
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
                <a href="#" class="education-achievements-link inline-action-button" data-focus-school="${focusSchool}">View Achievements ${Utils.lucideChevronRightSvg({ size: 16 })}</a>
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

    const renderRecentWork = () => {
        const gridContainer = document.getElementById('recent-work-grid');
        const listContainer = document.getElementById('recent-course-projects-list');
        if (!gridContainer || !state.renderer) return;

        const allGamesVideos = [
            ...(state.allData?.games || []),
            ...(state.allData?.videos || [])
        ].filter(item => item && item.name);

        allGamesVideos.sort((a, b) => {
            const timeA = Utils.parseFlexibleDateStringMs(a.date) || 0;
            const timeB = Utils.parseFlexibleDateStringMs(b.date) || 0;
            return timeB - timeA;
        });

        const recentGamesVideos = allGamesVideos.slice(0, 3);
        if (!recentGamesVideos.length) {
            gridContainer.innerHTML = '<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 20px;">No recent work available.</p>';
        } else {
            state.renderer.showSkeletons(gridContainer, recentGamesVideos.length);
            try {
                state.renderer.renderProjects(recentGamesVideos, gridContainer, true);
            } catch (e) {
                gridContainer.innerHTML = '<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 20px;">Unable to display recent work. Please refresh the page.</p>';
            }
        }
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
                        ${hasLink ? `<a class="activity-external-link inline-action-button" href="${escapeHtml(link)}" data-title="${escapeHtml(name)}" data-category="${escapeHtml(type || 'Activity')}" style="margin-top: 12px;">View Activity ${Utils.lucideChevronRightSvg({ size: 16 })}</a>` : ''}
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
        Utils.syncPageScrollLock(!!locked);
    };

    const closeAllColumnFilterMenus = () => {
        document.querySelectorAll('.column-filter-menu.open').forEach(menu => {
            menu.classList.remove('open');
        });
        document.querySelectorAll('.column-filter-header-flyout').forEach(el => {
            el.innerHTML = '';
            el.removeAttribute('data-header-filter-scope');
            el.removeAttribute('data-header-filter-key');
        });
        document.querySelectorAll('.column-header-filter-indicator.is-flyout-open').forEach(el => {
            el.classList.remove('is-flyout-open');
        });
        document.querySelectorAll('.column-filter-item.active').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.filter-icon-button[aria-expanded="true"]').forEach(button => {
            button.setAttribute('aria-expanded', 'false');
        });
        syncCoursesModalScrollLock(false);
        document.querySelectorAll('.custom-select-container.open, .multi-select-container.open').forEach(el => el.classList.remove('open'));
        if (typeof window.syncDropdownScrollLock === 'function') window.syncDropdownScrollLock();
    };

    window.closeAllColumnFilterMenus = closeAllColumnFilterMenus;

    const positionColumnFilterMenuAtButton = (button, menu) => {
        if (!button || !menu || !menu.classList.contains('open')) return;
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

    const syncColumnVisibilityToggles = (button, menu) => {
        const scope = getColumnFilterScope(button);
        if (!scope) return;
        const table = getTableForScope(scope);
        if (!table) return;
        menu.querySelectorAll('.column-filter-item').forEach(item => {
            const toggle = item.querySelector('.column-visibility-toggle');
            if (!toggle) return;
            const key = item.dataset.filterKey || '';
            if (!key) return;
            const columnIndex = getColumnIndexForScopeKey(scope, key);
            if (columnIndex <= 0) return;
            let isCssHidden = false;
            const th = table.querySelector(`thead th:nth-child(${columnIndex})`);
            if (th) {
                const originalDisplay = th.style.display;
                th.style.display = '';
                if (window.getComputedStyle(th).display === 'none') {
                    isCssHidden = true;
                }
                th.style.display = originalDisplay;
            }
            const hidden = isCssHidden || isColumnHidden(scope, key);
            const allowHide = isCssHidden ? false : canHideColumn(scope, key);
            toggle.classList.toggle('is-hidden', hidden);
            toggle.classList.toggle('is-locked', !allowHide);
            toggle.disabled = !allowHide;
            toggle.setAttribute('aria-label', hidden ? 'Show column' : 'Hide column');
            toggle.setAttribute('aria-pressed', hidden ? 'false' : 'true');
        });
    };

    const runColumnFilterMenuOpen = (button, menu, options = {}) => {
        const resetActiveColumn = options.resetActiveColumn !== false;
        document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(container => {
            container.classList.remove('open');
        });
        closeAllColumnFilterMenus();
        syncDropdownScrollLock();
        syncColumnVisibilityToggles(button, menu);
        menu.classList.remove('skip-animation');
        menu.classList.remove('skip-submenu-animation');
        menu.classList.add('open');
        menu.dataset.ignoreSubmenuHover = 'true';
        menu.dataset.submenuHovered = 'false';
        button.setAttribute('aria-expanded', 'true');
        if (resetActiveColumn) {
            menu.querySelectorAll('.column-filter-item').forEach(node => {
                node.classList.remove('active');
            });
        }
        requestAnimationFrame(() => {
            menu.dataset.ignoreSubmenuHover = 'false';
        });
        syncCoursesModalScrollLock(true);
        syncDropdownScrollLock();
        requestAnimationFrame(() => positionColumnFilterMenuAtButton(button, menu));
    };

    const NONE_FILTER_VALUE = '__NONE__';

    const formatFilterValueLabel = (value) => {
        const text = toText(value);
        if (!text) return '';
        if (/^[A-Z0-9]{2,}$/.test(text)) return text;
        return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    };

    const normalizeColumnFilterDefinitionList = (definitions) => {
        return (definitions || []).map(definition => {
            let filterable = definition.filterable !== false;
            const rawValues = (definition.values || []).map(value => toText(value));
            const hasMissing = rawValues.some(value => !value);
            const normalizedValues = Array.from(new Set(rawValues.filter(Boolean))).sort((a, b) => a.localeCompare(b));
            let values = hasMissing ? [NONE_FILTER_VALUE, ...normalizedValues] : normalizedValues;
            if (filterable && values.length <= 1) {
                filterable = false;
                values = [];
            }
            return { ...definition, filterable, values };
        });
    };

    const getSkillsRowsForColumnFilter = () => {
        const skills = Array.isArray(state.allData?.skills) ? state.allData.skills : [];
        if (state.isAchievementsPage) {
            return skills.filter(skill => skill.certified === true || String(skill.certified || '').toLowerCase() === 'true');
        }
        return skills;
    };

    const columnFilterHasDiscriminatoryPower = (key, filterValues, ctx) => {
        if (!ctx || !filterValues.length) return true;
        if (ctx.kind === 'portfolio') {
            const projects = ctx.projects || [];
            const n = projects.length;
            if (n === 0) return false;
            if (key === 'type') {
                for (const v of filterValues) {
                    const sel = [v];
                    let cnt = 0;
                    for (const p of projects) {
                        const cardType = toText(p.badge);
                        const normalizedCardType = cardType || NONE_FILTER_VALUE;
                        const matches = sel.includes('all') || sel.includes(cardType) || sel.includes(normalizedCardType);
                        if (matches) cnt++;
                    }
                    if (cnt < n) return true;
                }
                return false;
            }
            if (key === 'tools') {
                const noneLower = NONE_FILTER_VALUE.toLowerCase();
                for (const v of filterValues) {
                    const sel = [String(v).toLowerCase()];
                    let cnt = 0;
                    for (const p of projects) {
                        const cardTools = toText(p.tools).toLowerCase();
                        const toolsList = cardTools.split(',').map(t => t.trim()).filter(Boolean);
                        const hasNoTools = toolsList.length === 0;
                        const matches = sel.includes('all')
                            || toolsList.some(t => sel.includes(t))
                            || (hasNoTools && sel.includes(noneLower));
                        if (matches) cnt++;
                    }
                    if (cnt < n) return true;
                }
                return false;
            }
            return true;
        }
        if (ctx.kind === 'skills') {
            const skills = ctx.skills || [];
            const n = skills.length;
            if (n === 0) return false;
            if (key === 'type') {
                for (const v of filterValues) {
                    const sel = [String(v).toLowerCase()];
                    let cnt = 0;
                    for (const sk of skills) {
                        const itemType = toText(sk.badge).trim();
                        const normalizedType = itemType ? itemType.toLowerCase() : '__none__';
                        const matches = sel.includes('all') || sel.includes(normalizedType);
                        if (matches) cnt++;
                    }
                    if (cnt < n) return true;
                }
                return false;
            }
            if (key === 'level') {
                for (const v of filterValues) {
                    const sel = [String(v).toLowerCase()];
                    let cnt = 0;
                    for (const sk of skills) {
                        const itemLevel = (toText(sk.level).trim() || '-').trim();
                        const normalizedLevel = itemLevel ? itemLevel.toLowerCase() : '__none__';
                        const matches = sel.includes('all') || sel.includes(normalizedLevel);
                        if (matches) cnt++;
                    }
                    if (cnt < n) return true;
                }
                return false;
            }
            return true;
        }
        if (ctx.kind === 'courses') {
            const courses = ctx.courses || [];
            const n = courses.length;
            if (n === 0) return false;
            const fieldMap = {
                school: c => c.school,
                type: c => c.type,
                status: c => c.status,
                completionYear: c => c.completionYear,
                grade: c => c.grade
            };
            const getter = fieldMap[key];
            if (!getter) return true;
            for (const v of filterValues) {
                let cnt = 0;
                for (const c of courses) {
                    const normalizedValue = toText(getter(c)) || NONE_FILTER_VALUE;
                    if ([v].includes(normalizedValue)) cnt++;
                }
                if (cnt < n) return true;
            }
            return false;
        }
        return true;
    };

    const stripNonDiscriminatoryColumnFilters = (definitions, ctx) => {
        if (!ctx) return definitions;
        return definitions.map(def => {
            if (def.filterable === false || !def.values.length) return def;
            if (columnFilterHasDiscriminatoryPower(def.key, def.values, ctx)) return def;
            return { ...def, filterable: false, values: [] };
        });
    };

    let headerColumnFilterFlyoutEl = null;
    const getHeaderColumnFilterFlyout = () => {
        if (!headerColumnFilterFlyoutEl) {
            headerColumnFilterFlyoutEl = document.createElement('div');
            headerColumnFilterFlyoutEl.className = 'column-filter-menu column-filter-header-flyout';
            headerColumnFilterFlyoutEl.setAttribute('role', 'menu');
            headerColumnFilterFlyoutEl.setAttribute('aria-label', 'Column filter');
            headerColumnFilterFlyoutEl.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            document.body.appendChild(headerColumnFilterFlyoutEl);
        }
        return headerColumnFilterFlyoutEl;
    };

    const positionHeaderColumnFilterFlyout = (anchorEl, flyoutEl) => {
        if (!anchorEl || !flyoutEl) return;
        const run = () => {
            const anchorRect = anchorEl.getBoundingClientRect();
            const gap = 6;
            const pad = 12;
            flyoutEl.style.position = 'fixed';
            if (window.matchMedia('(max-width: 600px)').matches) {
                flyoutEl.style.left = '';
                flyoutEl.style.right = '';
                flyoutEl.style.top = '';
                flyoutEl.style.bottom = '';
                flyoutEl.style.width = '';
                flyoutEl.style.transform = '';
                return;
            }
            flyoutEl.style.right = 'auto';
            const fw = flyoutEl.getBoundingClientRect();
            let left = anchorRect.right - fw.width;
            let top = anchorRect.bottom + gap;
            if (left < pad) left = pad;
            if (left + fw.width > window.innerWidth - pad) left = window.innerWidth - pad - fw.width;
            if (top + fw.height > window.innerHeight - pad) {
                top = anchorRect.top - gap - fw.height;
            }
            if (top < pad) top = pad;
            flyoutEl.style.left = `${left}px`;
            flyoutEl.style.top = `${top}px`;
        };
        requestAnimationFrame(() => {
            requestAnimationFrame(run);
        });
    };

    const fillHeaderColumnFilterFlyout = (parentEl, definition, selectedMap, onPipelineChange, rerender) => {
        const prevHadClearWrap = !!parentEl.querySelector('.column-filter-clear-wrap');
        const wasFlyoutOpen = parentEl.classList.contains('open');
        parentEl.innerHTML = '';
        const selected = selectedMap || {};
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
            onPipelineChange();
            rerender();
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
                onPipelineChange();
                rerender();
            });

            subMenu.appendChild(row);
        });

        const definitionIsActive = isActiveColumnFilterSelection(selected, definition.key);
        if (definitionIsActive) {
            const clearWrap = document.createElement('div');
            clearWrap.className = 'column-filter-clear-wrap';
            if (!wasFlyoutOpen) {
                clearWrap.classList.add('is-pending-reveal');
            } else if (!prevHadClearWrap) {
                clearWrap.classList.add('is-revealing');
            }

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

            const textSpan = document.createElement('span');
            textSpan.className = 'column-filter-clear-text';
            textSpan.textContent = 'Clear Column Filter';

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

            clearButton.appendChild(textSpan);
            clearButton.appendChild(iconWrap);

            clearButton.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                delete selected[definition.key];
                onPipelineChange();
                closeAllColumnFilterMenus();
            });
            clearWrap.appendChild(clearButton);
            subMenu.appendChild(clearWrap);
        }

        parentEl.appendChild(subMenu);
        subMenu.addEventListener('mouseleave', (ev) => {
            if (!isActiveColumnFilterSelection(selected, definition.key)) return;
            const next = ev.relatedTarget;
            if (next && parentEl.contains(next)) return;
            closeAllColumnFilterMenus();
        });
    };

    const getColumnFilterScope = (button) => {
        const id = button?.id || '';
        if (id.startsWith('courses-')) return 'courses';
        if (id.startsWith('skills-')) return 'skills';
        if (id.startsWith('portfolio-')) return 'portfolio';
        return '';
    };

    const getColumnIndexForScopeKey = (scope, key) => {
        if (scope === 'skills') {
            if (key === 'name') return 1;
            if (key === 'type') return 2;
            if (key === 'level') return 3;
            if (key === 'lastUsed') return 4;
            return 0;
        }
        if (scope === 'courses') {
            if (key === 'id') return 1;
            if (key === 'name') return 2;
            if (key === 'school') return 3;
            if (key === 'type') return 4;
            if (key === 'status') return 5;
            if (key === 'credits') return 6;
            if (key === 'completionYear') return 7;
            if (key === 'grade') return 8;
            return 0;
        }
        return 0;
    };

    const getHiddenColumnMap = (scope) => {
        if (scope === 'skills') return state.hiddenSkillColumns;
        if (scope === 'courses') return state.hiddenCourseColumns;
        return null;
    };

    const getColumnCountForScope = (scope) => {
        if (scope === 'skills') return 4;
        if (scope === 'courses') return 8;
        return 0;
    };

    const canHideColumn = (scope, key) => {
        if ((scope === 'skills' || scope === 'courses') && key === 'name') return false;
        return true;
    };

    const isColumnHidden = (scope, key) => {
        const hiddenMap = getHiddenColumnMap(scope);
        return !!(hiddenMap && hiddenMap[key]);
    };

    const setColumnHidden = (scope, key, hidden) => {
        const hiddenMap = getHiddenColumnMap(scope);
        if (!hiddenMap || !key) return;
        if (hidden) {
            if (!canHideColumn(scope, key)) return;
            const totalColumns = getColumnCountForScope(scope);
            const hiddenCount = Object.keys(hiddenMap).filter(mapKey => hiddenMap[mapKey]).length + (hiddenMap[key] ? 0 : 1);
            const visibleAfter = totalColumns - hiddenCount;
            if (visibleAfter < 1) return;
            hiddenMap[key] = true;
            return;
        }
        delete hiddenMap[key];
    };

    const getTableForScope = (scope) => {
        if (scope === 'skills') return state.skillsList?.querySelector('.skills-table') || document.querySelector('.skills-table');
        if (scope === 'courses') return document.getElementById('courses-table');
        return null;
    };

    const applyHiddenColumnsToTable = (scope) => {
        const table = getTableForScope(scope);
        const hiddenMap = getHiddenColumnMap(scope);
        if (!table || !hiddenMap) return;

        const hiddenIndexes = new Set(
            Object.keys(hiddenMap)
                .filter(key => hiddenMap[key])
                .map(key => getColumnIndexForScopeKey(scope, key))
                .filter(index => index > 0)
        );

        table.querySelectorAll('thead tr').forEach(row => {
            Array.from(row.children).forEach((cell, idx) => {
                const colIndex = idx + 1;
                cell.style.display = hiddenIndexes.has(colIndex) ? 'none' : '';
            });
        });

        table.querySelectorAll('tbody tr').forEach(row => {
            Array.from(row.children).forEach((cell, idx) => {
                const colIndex = idx + 1;
                cell.style.display = hiddenIndexes.has(colIndex) ? 'none' : '';
            });
        });
    };

    const isActiveColumnFilterSelection = (selectedMap, key) => {
        const values = selectedMap?.[key];
        return Array.isArray(values) && values.length > 0 && !values.includes('all');
    };

    const hasActiveColumnFilters = (definitions, selectedMap) => {
        return (definitions || []).some(definition => {
            if (definition.filterable === false || !definition.values.length) return false;
            return isActiveColumnFilterSelection(selectedMap, definition.key);
        });
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
            const defs = definitions || [];
            document.querySelectorAll(`.column-header-filter-indicator[data-filter-scope="${scope}"]`).forEach(indicator => {
                const key = indicator.dataset.filterKey || '';
                const def = defs.find(d => d.key === key);
                const canFilterCol = !!(def && def.filterable !== false && def.values.length > 0);
                indicator.classList.toggle('is-disabled', !canFilterCol);
                if (!canFilterCol) {
                    indicator.classList.remove('is-active', 'is-flyout-open');
                } else {
                    const isActive = isActiveColumnFilterSelection(selectedMap, key);
                    indicator.classList.toggle('is-active', isActive);
                }
            });
        }
    };

    const renderColumnFilterMenu = (button, menu, definitions, selectedMap, onChange, activeKey, discriminationContext) => {
        if (!button || !menu) return;

        const selected = selectedMap || {};
        const scope = getColumnFilterScope(button);
        const wasOpen = menu.classList.contains('open');
        const prevHasClearWrap = Array.from(menu.children).some(el => el.classList && el.classList.contains('column-filter-clear-wrap'));
        let usableDefinitions = normalizeColumnFilterDefinitionList(definitions);
        if (discriminationContext) {
            usableDefinitions = stripNonDiscriminatoryColumnFilters(usableDefinitions, discriminationContext);
        }

        let prunedSelection = false;
        usableDefinitions.forEach(d => {
            const canCol = d.filterable !== false && d.values.length > 0;
            if (canCol) return;
            const cur = selected[d.key];
            if (cur === undefined) return;
            const isAll = Array.isArray(cur) && cur.includes('all');
            if (isAll) return;
            selected[d.key] = ['all'];
            prunedSelection = true;
        });
        if (scope) applyHiddenColumnsToTable(scope);

        syncColumnFilterVisualState(button, menu, usableDefinitions, selected, onChange);

        menu.classList.toggle('skip-animation', wasOpen);
        menu.classList.toggle('skip-submenu-animation', wasOpen);

        if (!menu._hasResizeListener) {
            window.addEventListener('resize', () => {
                if (menu.classList.contains('open') && typeof menu._reRender === 'function') {
                    menu._reRender();
                }
            });
            menu._hasResizeListener = true;
        }
        menu._reRender = () => {
            renderColumnFilterMenu(button, menu, definitions, selectedMap, onChange, activeKey, discriminationContext);
        };

        const closeMenu = () => {
            closeOpenSelectDropdowns();
            menu.classList.remove('open');
            menu.classList.remove('skip-animation');
            menu.classList.remove('skip-submenu-animation');
            menu.querySelectorAll('.column-filter-item').forEach(node => node.classList.remove('active'));
            button.setAttribute('aria-expanded', 'false');
            syncCoursesModalScrollLock(false);
            syncColumnFilterVisualState(button, menu, usableDefinitions, selected, onChange);
        };

        const prevSubmenuClearByKey = new Map();
        menu.querySelectorAll('.column-filter-item').forEach(itemNode => {
            const k = itemNode.dataset.filterKey;
            if (k && itemNode.querySelector('.column-filter-submenu .column-filter-clear-wrap')) {
                prevSubmenuClearByKey.set(k, true);
            }
        });

        menu.innerHTML = '';

        const activateDefinition = (definitionKey) => {
            if (menu.dataset.ignoreSubmenuHover === 'true') return;
            const definition = usableDefinitions.find(def => def.key === definitionKey);
            const canFilter = !!(definition && definition.filterable !== false && definition.values.length > 0);
            if (!canFilter) {
                menu.querySelectorAll('.column-filter-item').forEach(node => node.classList.remove('active'));
                return;
            }
            const currentActiveKey = menu.querySelector('.column-filter-item.active')?.dataset.filterKey;
            if (definitionKey !== currentActiveKey) menu.classList.remove('skip-submenu-animation');
            menu.querySelectorAll('.column-filter-item').forEach(node => {
                if (node.dataset.filterKey === definitionKey) node.classList.add('active');
                else node.classList.remove('active');
            });
        };

        const closeAllColumnFilterSubmenus = () => {
            if (menu.dataset.ignoreSubmenuHover === 'true') return;
            menu.querySelectorAll('.column-filter-item').forEach(node => node.classList.remove('active'));
        };

        const isInteractableColumnFilterControlTarget = target => {
            if (!target || typeof target.closest !== 'function') return false;
            const el = target.nodeType === Node.TEXT_NODE ? target.parentElement : target;
            if (!el) return false;
            if (el.closest('.column-filter-label-actions')) return true;
            const ind = el.closest('.column-filter-menu-indicator');
            if (ind && !ind.classList.contains('is-disabled')) return true;
            const vis = el.closest('.column-visibility-toggle');
            if (vis && !vis.disabled) return true;
            return false;
        };

        const isColumnFilterLabelKeyboardSubmenuTarget = target => {
            if (!target || typeof target.closest !== 'function') return false;
            const el = target.nodeType === Node.TEXT_NODE ? target.parentElement : target;
            if (!el) return false;
            if (el.classList && el.classList.contains('column-filter-column-label')) return true;
            return !!(el.closest && el.closest('.column-filter-label-text'));
        };

        usableDefinitions.forEach(definition => {
            const item = document.createElement('div');
            item.className = 'column-filter-item';
            item.dataset.filterKey = definition.key;
            const canFilter = definition.filterable !== false && definition.values.length > 0;
            if (activeKey && definition.key === activeKey && canFilter) item.classList.add('active');
            const definitionIsActive = isActiveColumnFilterSelection(selected, definition.key);

            const label = document.createElement('button');
            label.type = 'button';
            label.className = 'column-filter-column-label';
            label.classList.toggle('has-active-filter', definitionIsActive);
            label.classList.toggle('is-non-filterable', !canFilter);

            const labelText = document.createElement('span');
            labelText.className = 'column-filter-label-text';
            labelText.textContent = definition.label;

            const labelIndicator = document.createElement('span');
            labelIndicator.className = `column-filter-menu-indicator${definitionIsActive ? ' is-active' : ''}`;
            labelIndicator.classList.toggle('is-disabled', !canFilter);
            labelIndicator.setAttribute('aria-hidden', 'true');

            labelIndicator.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                if (!canFilter) return;
                if (!labelIndicator.classList.contains('is-active')) return;

                delete selected[definition.key];
                onChange();
                renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, undefined, discriminationContext);
            });
            if (canFilter) {
                labelIndicator.addEventListener('mouseenter', closeAllColumnFilterSubmenus);
            }

            const labelActions = document.createElement('span');
            labelActions.className = 'column-filter-label-actions';
            if (canFilter) labelActions.appendChild(labelIndicator);

            const columnIndex = getColumnIndexForScopeKey(scope, definition.key);
            if (columnIndex > 0) {
                let isCssHidden = false;
                const table = getTableForScope(scope);
                if (table) {
                    const th = table.querySelector(`thead th:nth-child(${columnIndex})`);
                    if (th) {
                        const originalDisplay = th.style.display;
                        th.style.display = '';
                        if (window.getComputedStyle(th).display === 'none') {
                            isCssHidden = true;
                        }
                        th.style.display = originalDisplay;
                    }
                }

                const hidden = isCssHidden || isColumnHidden(scope, definition.key);
                const allowHide = isCssHidden ? false : canHideColumn(scope, definition.key);
                const toggleButton = document.createElement('button');
                toggleButton.type = 'button';
                toggleButton.className = `column-visibility-toggle${hidden ? ' is-hidden' : ''}`;
                toggleButton.setAttribute('aria-label', hidden ? 'Show column' : 'Hide column');
                toggleButton.setAttribute('aria-pressed', hidden ? 'false' : 'true');
                toggleButton.classList.toggle('is-locked', !allowHide);
                if (!allowHide) toggleButton.disabled = true;
                toggleButton.innerHTML = `<span class="column-visibility-icon icon-eye" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg></span><span class="column-visibility-icon icon-eye-off" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="M10.733 5.076A10.744 10.744 0 0 1 12 5c4.3 0 7.93 2.75 9.338 6.594a1 1 0 0 1 0 .812 10.75 10.75 0 0 1-1.433 2.497"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499A10.75 10.75 0 0 1 12 19c-4.3 0-7.93-2.75-9.338-6.594a1 1 0 0 1 0-.812 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg></span>`;
                toggleButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    if (!allowHide) return;
                    setColumnHidden(scope, definition.key, !isColumnHidden(scope, definition.key));
                    applyHiddenColumnsToTable(scope);
                    renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, definition.key, discriminationContext);
                });
                if (allowHide) {
                    toggleButton.addEventListener('mouseenter', closeAllColumnFilterSubmenus);
                    toggleButton.addEventListener('focusin', closeAllColumnFilterSubmenus);
                }
                labelActions.appendChild(toggleButton);
            }

            const handleColumnFilterLabelPointerForSubmenu = (ev) => {
                if (isInteractableColumnFilterControlTarget(ev.target)) return;
                const actions = label.querySelector('.column-filter-label-actions');
                if (actions) {
                    const split = actions.getBoundingClientRect().left - 2;
                    if (ev.clientX >= split) {
                        closeAllColumnFilterSubmenus();
                        return;
                    }
                }
                activateDefinition(definition.key);
            };

            label.addEventListener('mouseenter', handleColumnFilterLabelPointerForSubmenu);
            label.addEventListener('mousemove', handleColumnFilterLabelPointerForSubmenu);

            label.appendChild(labelText);
            label.appendChild(labelActions);
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
                setTimeout(() => {
                    selected[definition.key] = ['all'];
                    onChange();
                    renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, definition.key, discriminationContext);
                }, 0);
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
                    setTimeout(() => {
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
                        renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, definition.key, discriminationContext);
                    }, 0);
                });

                subMenu.appendChild(row);
            });

            if (isActiveColumnFilterSelection(selected, definition.key)) {
                const clearWrap = document.createElement('div');
                clearWrap.className = 'column-filter-clear-wrap';
                const prevHadSubmenuClear = prevSubmenuClearByKey.get(definition.key);
                if (!wasOpen) {
                    clearWrap.classList.add('is-pending-reveal');
                } else if (!prevHadSubmenuClear) {
                    clearWrap.classList.add('is-revealing');
                }

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

                const textSpan = document.createElement('span');
                textSpan.className = 'column-filter-clear-text';
                textSpan.textContent = 'Clear Column Filter';

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

                clearButton.appendChild(textSpan);
                clearButton.appendChild(iconWrap);

                clearButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    setTimeout(() => {
                        delete selected[definition.key];
                        onChange();
                        renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, undefined, discriminationContext);
                        closeMenu();
                    }, 0);
                });

                clearWrap.appendChild(clearButton);
                subMenu.appendChild(clearWrap);
            }

            item.appendChild(subMenu);
            subMenu.addEventListener('mouseleave', (ev) => {
                if (menu.dataset.ignoreSubmenuHover === 'true') return;
                if (!isActiveColumnFilterSelection(selected, definition.key)) return;
                const next = ev.relatedTarget;
                if (next && menu.contains(next)) return;
                closeMenu();
            });
            item.addEventListener('mouseenter', (ev) => {
                if (ev.target.closest?.('.column-filter-submenu')) return;
                if (ev.target !== label && !label.contains(ev.target)) return;
                handleColumnFilterLabelPointerForSubmenu(ev);
            });
            item.addEventListener('mousemove', (ev) => {
                if (ev.target.closest?.('.column-filter-submenu')) return;
                if (ev.target !== label && !label.contains(ev.target)) return;
                handleColumnFilterLabelPointerForSubmenu(ev);
            });
            item.addEventListener('focusin', (ev) => {
                if (isInteractableColumnFilterControlTarget(ev.target)) {
                    closeAllColumnFilterSubmenus();
                    return;
                }
                if (!isColumnFilterLabelKeyboardSubmenuTarget(ev.target)) return;
                activateDefinition(definition.key);
            });
            menu.appendChild(item);
        });

        const hasAnyActive = hasActiveColumnFilters(usableDefinitions, selected);
        if (hasAnyActive) {
            const clearWrap = document.createElement('div');
            clearWrap.className = 'column-filter-clear-wrap';
            if (!wasOpen) clearWrap.classList.add('is-pending-reveal');
            else if (!prevHasClearWrap) clearWrap.classList.add('is-revealing');

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
            textSpan.textContent = 'Clear All Filters';

            clearButton.appendChild(textSpan);
            clearButton.appendChild(iconWrap);

            clearButton.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                resetColumnFilterSelections(usableDefinitions, selected);
                onChange();
                renderColumnFilterMenu(button, menu, usableDefinitions, selected, onChange, undefined, discriminationContext);
                closeMenu();
            });

            clearWrap.appendChild(clearButton);
            menu.appendChild(clearWrap);
        }

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
                if (usableDefinitions.length === 0) return;
                if (isOpen) return;
                runColumnFilterMenuOpen(button, menu, { resetActiveColumn: true });
            });
        }

        if (prunedSelection && typeof onChange === 'function') {
            onChange();
        }
    };

    const getSkillsColumnFilterDefinitions = () => {
        const certifiedSkills = getSkillsRowsForColumnFilter();
        return [
            {
                key: 'name',
                label: 'Name',
                filterable: false,
                values: []
            },
            {
                key: 'type',
                label: 'Category',
                filterable: true,
                values: certifiedSkills.map(skill => toText(skill.badge))
            },
            {
                key: 'level',
                label: 'Proficiency',
                filterable: true,
                values: certifiedSkills.map(skill => toText(skill.level))
            },
            {
                key: 'lastUsed',
                label: 'Last Used',
                filterable: false,
                values: []
            }
        ];
    };

    const renderSkillColumnFilter = () => {
        if (!state.isSkillsPage || !state.skillsFilterButton || !state.skillsFilterMenu) return;
        const definitions = getSkillsColumnFilterDefinitions();
        const discriminationContext = { kind: 'skills', skills: getSkillsRowsForColumnFilter() };
        renderColumnFilterMenu(
            state.skillsFilterButton,
            state.skillsFilterMenu,
            definitions,
            state.selectedSkillColumnValues,
            () => state.filterSkills && state.filterSkills(),
            undefined,
            discriminationContext
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

        const discriminationContext = { kind: 'portfolio', projects: list };
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
            },
            undefined,
            discriminationContext
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

    const parseCourseLanguagesUsedRaw = raw => {
        const s = toText(raw);
        if (!s) return [];
        return s
            .split(/[\n,;|]+/g)
            .map(part => toText(part).replace(/^[-*]\s*/, '').trim())
            .filter(Boolean)
            .reduce(
                (acc, lang) => {
                    const key = lang.toLowerCase();
                    if (!acc.seen.has(key)) {
                        acc.seen.add(key);
                        acc.items.push(lang);
                    }
                    return acc;
                },
                { seen: new Set(), items: [] }
            ).items;
    };

    const appendSoftwareLanguageTagsToContainer = (container, langStrings, skillToolsContext, options) => {
        if (!container) return;
        container.innerHTML = '';
        const list = Array.isArray(langStrings) ? langStrings : [];
        if (!list.length) return;
        const opts = options && typeof options === 'object' ? options : {};
        const nonInteractiveSkillName = String(opts.nonInteractiveSkillName || '').trim().toLowerCase();
        const disableSkillModalLinks = opts.disableSkillModalLinks === true;
        const disableCourseNavigationFromSkillModal = opts.disableCourseNavigationFromSkillModal === true;
        const skills = state.allData && state.allData.skills ? state.allData.skills : [];
        const modalManager = state.modalManager;
        const toolsCtx = Array.isArray(skillToolsContext) && skillToolsContext.length ? skillToolsContext : list;

        const languageEntries = list.map((lang) => {
            const langLower = lang.toLowerCase();
            const skillMatch = skills.find(sk => String(sk.name || '').toLowerCase() === langLower)
                || skills.find(sk => String(sk.name || '').toLowerCase().includes(langLower))
                || skills.find(sk => langLower.includes(String(sk.name || '').toLowerCase()));
            const fixedSrc = (skillMatch && skillMatch.icon)
                ? (modalManager && typeof modalManager.fixImagePath === 'function'
                    ? modalManager.fixImagePath(skillMatch.icon)
                    : skillMatch.icon)
                : '';
            return { lang, skillMatch, fixedSrc };
        });

        languageEntries.forEach(({ lang, skillMatch, fixedSrc }) => {
            const tag = document.createElement('span');
            tag.className = 'software-tag';

            const isSelf = !!(nonInteractiveSkillName && skillMatch
                && String(skillMatch.name || '').trim().toLowerCase() === nonInteractiveSkillName);
            if (isSelf) {
                tag.classList.add('software-tag-current-skill');
            }

            if (skillMatch && !isSelf && !disableSkillModalLinks) {
                tag.classList.add('clickable-tool');
                tag.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!state.openModalForItem) return;
                    if (disableCourseNavigationFromSkillModal) {
                        state.disableCourseNavigationFromSkillModal = true;
                    }
                    state.openModalForItem(skillMatch, 'skill', toolsCtx);
                });
            }

            if (fixedSrc) {
                const iconWrap = document.createElement('span');
                iconWrap.className = 'tool-icon-wrap';
                const icon = document.createElement('img');
                icon.className = 'tool-icon';
                icon.alt = lang.toUpperCase();
                icon.style.opacity = '0';
                let revealed = false;
                const revealIcon = () => {
                    if (revealed) return;
                    revealed = true;
                    if (typeof icon.decode === 'function') {
                        icon.decode().then(() => {
                            icon.style.opacity = '1';
                        }).catch(() => {
                            icon.style.opacity = '1';
                        });
                    } else {
                        requestAnimationFrame(() => {
                            icon.style.opacity = '1';
                        });
                    }
                };
                icon.onload = revealIcon;
                icon.onerror = () => {
                    icon.style.opacity = '0.5';
                };
                icon.src = fixedSrc;
                if (icon.complete && icon.naturalWidth > 0) {
                    revealIcon();
                }
                iconWrap.appendChild(icon);
                tag.appendChild(iconWrap);
            }

            const text = document.createElement('span');
            text.innerText = lang.toUpperCase();
            tag.appendChild(text);

            if (skillMatch) {
                const isCertified = skillMatch.certified === true || String(skillMatch.certified || '').toLowerCase() === 'true';
                if (isCertified) {
                    const cert = document.createElement('span');
                    cert.className = 'grid-certified-badge';
                    cert.title = skillMatch.certName || skillMatch.name || 'Certified';
                    cert.innerText = 'CERTIFIED';
                    tag.appendChild(cert);
                }
            }

            container.appendChild(tag);
        });
    };

    const languageStringRefersToSkill = (langStr, skillName) => {
        const skills = state.allData && state.allData.skills ? state.allData.skills : [];
        const sn = String(skillName || '').trim().toLowerCase();
        if (!sn) return false;
        const langLower = String(langStr || '').trim().toLowerCase();
        if (!langLower) return false;
        const skillMatch = skills.find(sk => String(sk.name || '').toLowerCase() === langLower)
            || skills.find(sk => String(sk.name || '').toLowerCase().includes(langLower))
            || skills.find(sk => langLower.includes(String(sk.name || '').toLowerCase()));
        return !!(skillMatch && String(skillMatch.name || '').trim().toLowerCase() === sn);
    };

    const getCourseProjectRowsForSkill = (skillName) => {
        const projects = Array.isArray(state.allData?.['Course Projects']) ? state.allData['Course Projects'] : [];
        const sn = String(skillName || '').trim().toLowerCase();
        if (!sn) return [];
        return projects.filter(row => {
            const list = parseCourseLanguagesUsedRaw(row.languagesUsed || row.languagesused);
            return list.some(lang => languageStringRefersToSkill(lang, sn));
        });
    };

    const getAggregatedCourseProjectLanguagesForSkill = (skillName) => {
        const rows = getCourseProjectRowsForSkill(skillName);
        const aggregated = [];
        const seen = new Set();
        rows.forEach(row => {
            parseCourseLanguagesUsedRaw(row.languagesUsed || row.languagesused).forEach(lang => {
                const key = String(lang).trim().toLowerCase();
                if (!key || seen.has(key)) return;
                seen.add(key);
                aggregated.push(String(lang).trim());
            });
        });
        return aggregated;
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
            const languagesUsed = toText(row.languagesUsed || row.languagesused);
            return { id, name, school, type, info, status, completionYear, grade, credits, languagesUsed, originalIndex: index };
        }).filter(course => course.id || course.name || course.school || course.type || course.status || course.grade || course.credits || course.info || course.languagesUsed);
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

    const getCoursesModalCourseList = () => {
        if (state.coursesModalUseStandaloneList && Array.isArray(state.coursesModalStandaloneList) && state.coursesModalStandaloneList.length) {
            return state.coursesModalStandaloneList;
        }
        return state.filteredCourses;
    };

    const getVisibleCourseIndexes = () => getCoursesModalCourseList().map((_, index) => index);

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

    const normalizeCourseIdForProjectMatch = (v) => String(v ?? '').trim().toLowerCase();

    const findCourseProjectRowForCourse = (course) => {
        const rows = Array.isArray(state.allData?.['Course Projects']) ? state.allData['Course Projects'] : [];
        const key = normalizeCourseIdForProjectMatch(course?.id);
        if (!key) return null;
        return rows.find(r => {
            const rid = normalizeCourseIdForProjectMatch(r?.id ?? r?.courseid ?? r?.courseId);
            return rid && rid === key;
        }) || null;
    };

    const getCourseNameByCourseId = (courseId) => {
        const key = normalizeCourseIdForProjectMatch(courseId);
        if (!key) return '';
        const rows = normalizeCourses(state.allData?.Courses || []);
        const match = rows.find(c => normalizeCourseIdForProjectMatch(c.id) === key);
        const n = match && String(match.name || '').trim();
        return n || '';
    };

    const coursesLink2IconSvg = `<svg class="courses-link2-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false"><path d="M9 17H7A5 5 0 0 1 7 7h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h2a5 5 0 1 1 0 10h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 12h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const buildCourseNameCellHtml = (course) => {
        const rawName = course?.name;
        const safeName = escapeHtml(rawName && String(rawName).trim() ? rawName : '-');
        const projectRow = findCourseProjectRowForCourse(course);
        const linkRaw = projectRow ? toText(projectRow.link).trim() : '';
        const hasLink = /^https?:\/\//i.test(linkRaw);
        if (!projectRow || !hasLink) {
            return `<span class="courses-name-cell-inner"><span class="courses-name-text">${safeName}</span></span>`;
        }
        const suffix = `<span class="courses-name-featured-suffix"><span class="courses-name-featured-icon">${coursesLink2IconSvg}</span><span class="courses-name-featured-label">Featured project</span></span>`;
        return `<span class="courses-name-cell-inner"><span class="courses-name-text">${safeName}</span>${suffix}</span>`;
    };

    const populateCoursesModal = (index) => {
        const courseList = getCoursesModalCourseList();
        if (!courseList.length || index < 0 || index >= courseList.length) return;
        state.currentCourseIndex = index;
        const course = courseList[index];

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
        const rawInfo = toText(course.info);
        const languagesSectionRegex = /Programming Languages Used\s*:\s*([\s\S]*)$/i;
        const languagesSectionMatch = rawInfo.match(languagesSectionRegex);
        let infoText = rawInfo;
        if (languagesSectionMatch) {
            infoText = rawInfo.replace(languagesSectionRegex, '').trim();
        }

        if (state.coursesModalInfo) state.coursesModalInfo.textContent = infoText || 'No course information available.';

        const courseModalLangTagOptions = {
            disableCourseNavigationFromSkillModal: true,
            ...(state.coursesModal && state.coursesModal.classList.contains('courses-modal-over-modal')
                ? { disableSkillModalLinks: true }
                : {})
        };

        const featuredSection = state.coursesModalFeaturedSection;
        const featuredDesc = state.coursesModalFeaturedDesc;
        const featuredLink = state.coursesModalFeaturedLink;
        const featuredLangWrap = state.coursesModalFeaturedLangWrap;
        const featuredLangContainer = state.coursesModalFeaturedLanguages;
        if (featuredSection && featuredDesc && featuredLink) {
            const projectRow = findCourseProjectRowForCourse(course);
            const linkRaw = projectRow ? toText(projectRow.link).trim() : '';
            const hasLink = /^https?:\/\//i.test(linkRaw);
            const projName = projectRow ? toText(projectRow.name).trim() : '';
            if (projectRow && hasLink) {
                const displayName = projName || 'View project';
                const projInfo = toText(projectRow.info).trim();
                const projectLangs = parseCourseLanguagesUsedRaw(projectRow.languagesUsed || projectRow.languagesused);
                featuredSection.classList.add('is-visible');
                featuredSection.setAttribute('aria-hidden', 'false');
                if (projInfo) {
                    featuredDesc.textContent = projInfo;
                    featuredDesc.style.display = 'block';
                } else {
                    featuredDesc.textContent = '';
                    featuredDesc.style.display = 'none';
                }
                if (featuredLangWrap && featuredLangContainer) {
                    if (projectLangs.length) {
                        featuredLangWrap.style.display = 'block';
                        const projLangLabel = state.coursesModalFeaturedProjectLangLabel
                            || featuredLangWrap.querySelector('.courses-modal-featured-project-lang-label');
                        if (projLangLabel) {
                            projLangLabel.textContent = projectLangs.length === 1 ? 'Project Language' : 'Project Languages';
                        }
                        if (featuredLangContainer) {
                            featuredLangContainer.setAttribute(
                                'aria-label',
                                projectLangs.length === 1 ? 'Programming language used in featured project' : 'Programming languages used in featured project'
                            );
                        }
                        appendSoftwareLanguageTagsToContainer(featuredLangContainer, projectLangs, projectLangs, courseModalLangTagOptions);
                    } else {
                        featuredLangWrap.style.display = 'none';
                        featuredLangContainer.innerHTML = '';
                    }
                }
                featuredLink.style.setProperty('--inline-action-color', '#58a6ff');
                featuredLink.innerHTML = `${displayName} ${Utils.lucideChevronRightSvg({ size: 14 })}`;
                featuredLink.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openExternalLinkWithPrompt(linkRaw, displayName, 'Featured Project', projInfo);
                };
            } else {
                featuredSection.classList.remove('is-visible');
                featuredSection.setAttribute('aria-hidden', 'true');
                featuredDesc.textContent = '';
                featuredDesc.style.display = 'none';
                if (featuredLangWrap) featuredLangWrap.style.display = 'none';
                if (featuredLangContainer) featuredLangContainer.innerHTML = '';
                featuredLink.textContent = '';
                featuredLink.onclick = null;
            }
        }

        let languages = parseCourseLanguagesUsedRaw(course.languagesUsed);
        if (!languages.length && languagesSectionMatch) {
            languages = parseCourseLanguagesUsedRaw(languagesSectionMatch[1]);
        }

        const labelEl = state.coursesModalProgrammingLanguagesLabel;
        const containerEl = state.coursesModalProgrammingLanguagesContainer;
        if (labelEl && containerEl) {
            if (!languages.length) {
                labelEl.style.display = 'none';
                containerEl.style.display = 'none';
                containerEl.innerHTML = '';
            } else {
                labelEl.textContent = languages.length === 1 ? 'Course Language' : 'Course Languages';
                containerEl.setAttribute(
                    'aria-label',
                    languages.length === 1 ? 'Programming language used in this course' : 'Programming languages used in this course'
                );
                labelEl.style.display = 'block';
                containerEl.style.display = 'flex';
                appendSoftwareLanguageTagsToContainer(containerEl, languages, languages, courseModalLangTagOptions);
            }
        }
        updateCoursesModalNavState();
    };

    const getLanguageIconUrlsForCourse = (course) => {
        if (!course || !state.modalManager) return [];
        const skills = Array.isArray(state.allData?.skills) ? state.allData.skills : [];
        if (!skills.length) return [];
        const skillsByLowerName = new Map();
        skills.forEach((sk) => {
            const n = sk && String(sk.name || '').trim().toLowerCase();
            if (n && !skillsByLowerName.has(n)) skillsByLowerName.set(n, sk);
        });
        const languageRegex = /Programming Languages Used\s*:\s*([\s\S]*)$/i;
        const langs = new Set();
        parseCourseLanguagesUsedRaw(course.languagesUsed || course.languagesused).forEach((l) => langs.add(l));
        const rawInfo = toText(course.info);
        const match = rawInfo.match(languageRegex);
        if (match) parseCourseLanguagesUsedRaw(match[1]).forEach((l) => langs.add(l));
        const projectRow = findCourseProjectRowForCourse(course);
        if (projectRow) {
            parseCourseLanguagesUsedRaw(projectRow.languagesUsed || projectRow.languagesused).forEach((l) => langs.add(l));
        }
        const urls = new Set();
        langs.forEach((lang) => {
            const langLower = lang.toLowerCase();
            let skill = skillsByLowerName.get(langLower);
            if (!skill) {
                skill = skills.find((sk) => String(sk.name || '').toLowerCase().includes(langLower))
                    || skills.find((sk) => langLower.includes(String(sk.name || '').toLowerCase()));
            }
            if (!skill || !skill.icon) return;
            const fixedSrc = state.modalManager.fixImagePath(skill.icon);
            if (fixedSrc) urls.add(fixedSrc);
        });
        return [...urls];
    };

    const primeCourseRowLanguageIcons = (course) => {
        if (!state.modalManager || !course) return;
        getLanguageIconUrlsForCourse(course).forEach((src) => {
            state.modalManager.preloadImage(src, 4000);
        });
    };

    const preloadProgrammingLanguageIconsForCourses = (coursesRows, projectRows) => {
        if (state.coursesProgrammingLanguageIconsPreloaded) return Promise.resolve();
        if (state.coursesLanguageIconsPreloadPromise) return state.coursesLanguageIconsPreloadPromise;
        if (!state.modalManager) return Promise.resolve();
        const skills = state.allData && Array.isArray(state.allData.skills) ? state.allData.skills : [];
        if (!skills.length) return Promise.resolve();

        const skillsByLowerName = new Map();
        skills.forEach(sk => {
            const n = sk && typeof sk.name !== 'undefined' ? String(sk.name).trim().toLowerCase() : '';
            if (!n) return;
            if (!skillsByLowerName.has(n)) skillsByLowerName.set(n, sk);
        });

        const languageRegex = /Programming Languages Used\s*:\s*([\s\S]*)$/i;
        const languages = new Set();
        (Array.isArray(coursesRows) ? coursesRows : []).forEach(row => {
            parseCourseLanguagesUsedRaw(row && (row.languagesUsed || row.languagesused)).forEach(lang => languages.add(lang));
            const rawInfo = toText(row && row.info);
            const match = rawInfo.match(languageRegex);
            if (match) {
                parseCourseLanguagesUsedRaw(match[1]).forEach(lang => languages.add(lang));
            }
        });
        (Array.isArray(projectRows) ? projectRows : []).forEach(row => {
            parseCourseLanguagesUsedRaw(row && (row.languagesUsed || row.languagesused)).forEach(lang => languages.add(lang));
        });
        if (!languages.size) {
            state.coursesProgrammingLanguageIconsPreloaded = true;
            return Promise.resolve();
        }

        const iconUrls = new Set();
        languages.forEach(lang => {
            const langLower = lang.toLowerCase();
            let skill = skillsByLowerName.get(langLower);
            if (!skill) {
                skill = skills.find(sk => String(sk.name || '').toLowerCase().includes(langLower))
                    || skills.find(sk => langLower.includes(String(sk.name || '').toLowerCase()));
            }
            if (!skill || !skill.icon) return;
            const fixedSrc = state.modalManager && typeof state.modalManager.fixImagePath === 'function'
                ? state.modalManager.fixImagePath(skill.icon)
                : skill.icon;
            if (fixedSrc) iconUrls.add(fixedSrc);
        });

        if (!iconUrls.size) {
            state.coursesProgrammingLanguageIconsPreloaded = true;
            return Promise.resolve();
        }

        const urls = [...iconUrls];
        const timeoutMs = 4000;
        state.coursesLanguageIconsPreloadPromise = Promise.all(
            urls.map(src => state.modalManager.preloadImage(src, timeoutMs))
        ).then(() => {
            state.coursesProgrammingLanguageIconsPreloaded = true;
        }).finally(() => {
            state.coursesLanguageIconsPreloadPromise = null;
        });
        return state.coursesLanguageIconsPreloadPromise;
    };

    const updateCoursesModalNavState = () => {
        const canNavigate = getCoursesModalCourseList().length > 1;
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

    const clearCoursesModalOverlayState = () => {
        state.coursesModalUseStandaloneList = false;
        state.coursesModalStandaloneList = null;
        if (state.coursesModal) {
            state.coursesModal.classList.remove('courses-modal-over-modal');
        }
    };

    const openCoursesModal = async (index) => {
        const courseList = getCoursesModalCourseList();
        if (!state.coursesModal || !courseList.length) return;
        if (index < 0 || index >= courseList.length) return;
        state.coursesModalClosing = false;

        await preloadProgrammingLanguageIconsForCourses(state.allData?.Courses || [], state.allData?.['Course Projects'] || []);

        const courseForIcons = courseList[index];
        if (courseForIcons && state.modalManager) {
            const iconUrls = getLanguageIconUrlsForCourse(courseForIcons);
            if (iconUrls.length) {
                await Promise.all(iconUrls.map((src) => state.modalManager.preloadImage(src, 4000)));
            }
        }

        populateCoursesModal(index);
        updateCoursesModalNavState();

        if (state.coursesModal._closeTimer) {
            clearTimeout(state.coursesModal._closeTimer);
            state.coursesModal._closeTimer = null;
        }

        state.coursesModal.setAttribute('aria-hidden', 'false');
        syncCoursesModalScrollLock(true);
        if (state.modalManager && typeof state.modalManager.fadeInModal === 'function') {
            state.modalManager.fadeInModal(state.coursesModal);
            state.coursesModal.classList.add('open');
        } else {
            state.coursesModal.style.display = 'flex';
            state.coursesModal.classList.add('open');
        }
    };

    const closeCoursesModal = () => {
        if (!state.coursesModal) return;
        state.coursesModalClosing = true;
        state.coursesModal.setAttribute('aria-hidden', 'true');

        if (state.coursesModal._closeTimer) clearTimeout(state.coursesModal._closeTimer);
        state.coursesModal._closeTimer = null;

        if (state.modalManager?.fadeOutModal) {
            state.modalManager.fadeOutModal(state.coursesModal, () => {
                state.coursesModal.classList.remove('open');
                clearCoursesModalOverlayState();
                state.coursesModalClosing = false;
                syncCoursesModalScrollLock(false);
            });
            return;
        }

        state.coursesModal.classList.remove('open');
        state.coursesModal._closeTimer = setTimeout(() => {
            if (state.coursesModal) state.coursesModal.style.display = 'none';
            clearCoursesModalOverlayState();
            state.coursesModalClosing = false;
            syncCoursesModalScrollLock(false);
        }, 190);
    };

    const openCoursesModalForCourseIdFromSkill = async (courseIdRaw) => {
        if (!state.coursesModal) return;
        const lookupKey = normalizeCourseIdForProjectMatch(courseIdRaw);
        if (!lookupKey) return;
        const all = normalizeCourses(state.allData?.Courses || []);
        const course = all.find(c => normalizeCourseIdForProjectMatch(c.id) === lookupKey);
        if (!course) return;
        if (state.coursesModalUseStandaloneList && state.coursesModal.classList.contains('open') && !state.coursesModalClosing) {
            const list = getCoursesModalCourseList();
            const cur = list[state.currentCourseIndex];
            if (cur && normalizeCourseIdForProjectMatch(cur.id) === lookupKey) return;
            state.coursesModalStandaloneList = [course];
            populateCoursesModal(0);
            updateCoursesModalNavState();
            return;
        }
        const skillModalStacked =
            (state.modal && state.modal.style.display === 'flex' && state.modal.classList.contains('modal-skill'))
            || (state.secModal && state.secModal.style.display === 'flex');
        if (skillModalStacked) {
            state.coursesModal.classList.add('courses-modal-over-modal');
        }
        state.coursesModalUseStandaloneList = true;
        state.coursesModalStandaloneList = [course];
        await openCoursesModal(0);
    };

    window.closeCoursesModal = closeCoursesModal;
    window.openCoursesModalForCourseIdFromSkill = openCoursesModalForCourseIdFromSkill;

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

        state.currentCourseIndex = nextIndex;

        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false;

        const transitionTargets = [titleWrap, body].filter(Boolean);
        if (!transitionTargets.length) return;

        if (prefersReducedMotion) {
            transitionTargets.forEach(target => {
                target.style.transition = '';
                target.style.willChange = '';
                target.style.opacity = '';
                target.style.transform = '';
            });
            populateCoursesModal(nextIndex);
            updateCoursesModalNavState();
            return;
        }

        const durationMs = 150;
        const exitShift = delta >= 0 ? -12 : 12;
        const enterShift = -exitShift;
        const token = state.coursesModal._transitionToken = (state.coursesModal._transitionToken || 0) + 1;

        transitionTargets.forEach(target => {
            target.style.willChange = 'opacity, transform';
            target.style.transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`;
            target.style.opacity = '0';
            target.style.transform = `translate3d(${exitShift}px, 0, 0)`;
        });

        setTimeout(() => {
            if (!state.coursesModal || token !== state.coursesModal._transitionToken) return;
            populateCoursesModal(nextIndex);

            transitionTargets.forEach(target => {
                target.style.transition = 'none';
                target.style.opacity = '0';
                target.style.transform = `translate3d(${enterShift}px, 0, 0)`;
            });

            requestAnimationFrame(() => {
                if (!state.coursesModal || token !== state.coursesModal._transitionToken) return;
                transitionTargets.forEach(target => {
                    target.style.transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`;
                    target.style.opacity = '1';
                    target.style.transform = 'translate3d(0px, 0, 0)';
                });

                setTimeout(() => {
                    if (!state.coursesModal || token !== state.coursesModal._transitionToken) return;
                    transitionTargets.forEach(target => {
                        target.style.transition = '';
                        target.style.willChange = '';
                        target.style.opacity = '';
                        if (target === body) {
                            target.style.transform = 'translate3d(0px, 0, 0)';
                        } else {
                            target.style.transform = '';
                        }
                    });
                }, durationMs + 30);
            });
        }, durationMs);
    };

    const renderCoursesTable = () => {
        if (!state.coursesTableBody) return;
        const coursesShell = state.coursesTableBody.closest('.courses-table-shell');
        lockTableShellHeight(coursesShell);
        applyHiddenColumnsToTable('courses');
        const coursesTableEl = document.getElementById('courses-table');
        if (coursesTableEl) {
            coursesTableEl.querySelector('colgroup')?.remove();
            coursesTableEl.classList.remove('table-fit', 'table-fit-nowrap');
            coursesTableEl.style.width = '';
            coursesTableEl.style.minWidth = '';
            coursesTableEl.style.tableLayout = '';
        }
        const courses = state.filteredCourses;
        const coursesTotalAll = normalizeCourses(state.allData?.Courses || []).length;
        if (state.filterManager) {
            state.filterManager.updateFilterResultsLine('courses-filter-results-count', courses.length, coursesTotalAll, 'courses', 'course');
        }

        if (!courses.length) {
            const emptyMsg = 'No courses match the current filters.';
            const statusEl = document.getElementById('courses-search-status');
            state.coursesTableBody.innerHTML = `<tr><td colspan="8" class="courses-loading-row">${emptyMsg}</td></tr>`;
            if (statusEl) {
                statusEl.classList.add('visible');
                const rawQuery = state.courseSearchQuery ? state.courseSearchQuery.trim() : '';
                if (rawQuery) {
                    const safe = rawQuery.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    statusEl.innerHTML = `Showing results for "<span style="color:#58a6ff;">${safe}</span>"`;
                } else {
                    statusEl.innerHTML = emptyMsg;
                }
            }
            lockTableShellHeight(coursesShell);
            applyHiddenColumnsToTable('courses');
            return;
        }

        state.coursesTableBody.innerHTML = courses.map((course, index) => {
            const statusBadge = buildCourseBadge(course.status || '-', getCourseStatusBadgeClass(course.status));
            const gradeBadge = buildCourseBadge(course.grade || '-', getCourseGradeBadgeClass(course.grade));
            const rowClasses = ['course-row'];
            if (index === courses.length - 1 && courses.length === coursesTotalAll) rowClasses.push('last-visible-row');
            return `
                <tr class="${rowClasses.join(' ')}" data-course-index="${index}">
                    <td>${escapeHtml(course.id || '-')}</td>
                    <td class="courses-name-cell">${buildCourseNameCellHtml(course)}</td>
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
            const primeRowIcons = () => {
                const index = Number.parseInt(row.getAttribute('data-course-index') || '-1', 10);
                const course = Number.isFinite(index) && index >= 0 ? courses[index] : null;
                if (course) primeCourseRowLanguageIcons(course);
            };
            row.addEventListener('pointerenter', primeRowIcons);
            row.addEventListener('pointerdown', primeRowIcons);
        });

        const statusEl = document.getElementById('courses-search-status');
        if (statusEl) {
            const rawQuery = state.courseSearchQuery ? state.courseSearchQuery.trim() : '';
            if (rawQuery) {
                const safe = rawQuery.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                statusEl.classList.add('visible');
                statusEl.innerHTML = `Showing results for "<span style="color:#58a6ff;">${safe}</span>"`;
            } else {
                statusEl.classList.remove('visible');
                statusEl.innerHTML = '';
            }
        }
        lockTableShellHeight(coursesShell);
        applyHiddenColumnsToTable('courses');

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
            const proj = findCourseProjectRowForCourse(course);
            const projBlob = proj
                ? `${toText(proj.name)} ${toText(proj.info)} ${toText(proj.link)} featured project`.toLowerCase()
                : '';
            const searchBlob = `${course.id} ${course.name} ${course.school} ${course.type} ${course.info} ${course.languagesUsed || ''} ${course.status} ${course.completionYear || ''} ${course.grade} ${course.credits} ${projBlob}`.toLowerCase();
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

    state.applyCoursesFilterAndSort = applyCoursesFilterAndSort;

    const renderCoursesColumnFilter = (activeKey) => {
        if (!state.coursesFilterButton || !state.coursesFilterMenu) return;
        const onChange = state.applyCoursesFilterAndSort;
        if (!onChange) return;
        const courses = normalizeCourses(state.allData?.Courses || []);
        const definitions = [
            { key: 'id', label: 'ID', filterable: false, values: [] },
            { key: 'name', label: 'Name', filterable: false, values: [] },
            { key: 'school', label: 'School', values: courses.map(course => course.school) },
            { key: 'type', label: 'Type', values: courses.map(course => course.type) },
            { key: 'status', label: 'Status', values: courses.map(course => course.status) },
            { key: 'credits', label: 'Credits', filterable: false, values: [] },
            { key: 'completionYear', label: 'Year', values: courses.map(course => course.completionYear) },
            { key: 'grade', label: 'Grade', values: courses.map(course => course.grade) }
        ];
        const discriminationContext = { kind: 'courses', courses };
        renderColumnFilterMenu(
            state.coursesFilterButton,
            state.coursesFilterMenu,
            definitions,
            state.selectedCourseColumnValues,
            onChange,
            activeKey,
            discriminationContext
        );
    };

    const openHeaderColumnFilterFlyout = (scope, filterKey, anchorEl) => {
        if (!filterKey || !anchorEl) return;

        let getDefinitions;
        let selectedMap;
        let finalize;
        let discriminationCtx = null;

        if (scope === 'skills') {
            getDefinitions = getSkillsColumnFilterDefinitions;
            selectedMap = state.selectedSkillColumnValues;
            discriminationCtx = { kind: 'skills', skills: getSkillsRowsForColumnFilter() };
            finalize = () => {
                if (state.filterSkills) state.filterSkills();
                renderSkillColumnFilter();
            };
        } else if (scope === 'courses') {
            getDefinitions = () => {
                const courses = normalizeCourses(state.allData?.Courses || []);
                return [
                    { key: 'id', label: 'ID', filterable: false, values: [] },
                    { key: 'name', label: 'Name', filterable: false, values: [] },
                    { key: 'school', label: 'School', values: courses.map(course => course.school) },
                    { key: 'type', label: 'Type', values: courses.map(course => course.type) },
                    { key: 'status', label: 'Status', values: courses.map(course => course.status) },
                    { key: 'credits', label: 'Credits', filterable: false, values: [] },
                    { key: 'completionYear', label: 'Year', values: courses.map(course => course.completionYear) },
                    { key: 'grade', label: 'Grade', values: courses.map(course => course.grade) }
                ];
            };
            selectedMap = state.selectedCourseColumnValues;
            discriminationCtx = { kind: 'courses', courses: normalizeCourses(state.allData?.Courses || []) };
            finalize = () => {
                if (state.applyCoursesFilterAndSort) state.applyCoursesFilterAndSort();
                renderCoursesColumnFilter();
            };
        } else if (scope === 'portfolio') {
            if (!(state.currentRoute === '/videos' || state.currentRoute === '/games')) return;
            const pageType = state.currentRoute === '/games' ? 'games' : 'videos';
            discriminationCtx = {
                kind: 'portfolio',
                projects: Array.isArray(state.allData?.[pageType]) ? state.allData[pageType] : []
            };
            getDefinitions = () => {
                const list = Array.isArray(state.allData?.[pageType]) ? state.allData[pageType] : [];
                return [
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
            };
            selectedMap = state.selectedPortfolioColumnValues;
            if (!('type' in state.selectedPortfolioColumnValues)) state.selectedPortfolioColumnValues.type = ['all'];
            if (!('tools' in state.selectedPortfolioColumnValues)) state.selectedPortfolioColumnValues.tools = ['all'];
            finalize = () => {
                const selectedByColumn = state.selectedPortfolioColumnValues || {};
                state.selectedCategories = Array.isArray(selectedByColumn.type) ? [...selectedByColumn.type] : ['all'];
                state.selectedTools = Array.isArray(selectedByColumn.tools) ? [...selectedByColumn.tools] : ['all'];
                if (!('type' in selectedByColumn)) state.selectedCategories = ['all'];
                if (!('tools' in selectedByColumn)) state.selectedTools = ['all'];
                if (state.filterCards) state.filterCards();
                const list = Array.isArray(state.allData?.[pageType]) ? state.allData[pageType] : [];
                renderPortfolioColumnFilter(list);
            };
        } else {
            return;
        }

        const usable = stripNonDiscriminatoryColumnFilters(normalizeColumnFilterDefinitionList(getDefinitions()), discriminationCtx);
        const definition = usable.find(d => d.key === filterKey);
        if (!definition) return;
        if (definition.filterable === false || definition.values.length === 0) return;

        closeAllColumnFilterMenus();

        const flyout = getHeaderColumnFilterFlyout();
        const rerender = () => {
            flyout.classList.toggle('skip-submenu-animation', flyout.classList.contains('open'));
            const u = stripNonDiscriminatoryColumnFilters(normalizeColumnFilterDefinitionList(getDefinitions()), discriminationCtx);
            const def = u.find(d => d.key === filterKey);
            if (!def || def.filterable === false || def.values.length === 0) {
                closeAllColumnFilterMenus();
                syncDropdownScrollLock();
                return;
            }
            fillHeaderColumnFilterFlyout(flyout, def, selectedMap, finalize, rerender);
            positionHeaderColumnFilterFlyout(anchorEl, flyout);
        };

        flyout.classList.remove('skip-submenu-animation');
        fillHeaderColumnFilterFlyout(flyout, definition, selectedMap, finalize, rerender);
        flyout.dataset.headerFilterScope = scope;
        flyout.dataset.headerFilterKey = filterKey;
        flyout.classList.add('open');
        if (anchorEl && anchorEl.classList.contains('column-header-filter-indicator')) {
            anchorEl.classList.add('is-flyout-open');
        }
        positionHeaderColumnFilterFlyout(anchorEl, flyout);
        syncCoursesModalScrollLock(true);
        syncDropdownScrollLock();
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
                coursesClearBtn.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                });
                coursesClearBtn.addEventListener('click', () => {
                    state.coursesSearchInput.value = '';
                    state.courseSearchQuery = '';
                    updateClearButton();
                    applyCoursesFilterAndSort();
                    if (document.activeElement !== state.coursesSearchInput) state.coursesSearchInput.focus();
                });
            }
            updateClearButton();
        }

        if (state.coursesFilterButton && state.coursesFilterMenu) {
            renderCoursesColumnFilter();
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

        if (state.coursesModalClose && !state.coursesModalClose.dataset.boundCoursesModal) {
            state.coursesModalClose.dataset.boundCoursesModal = 'true';
            state.coursesModalClose.addEventListener('click', closeCoursesModal);
        }
        if (state.coursesModalPrev && !state.coursesModalPrev.dataset.boundCoursesModal) {
            state.coursesModalPrev.dataset.boundCoursesModal = 'true';
            state.coursesModalPrev.addEventListener('click', (event) => {
                event.stopPropagation();
                navigateCoursesModal(-1);
            });
        }
        if (state.coursesModalNext && !state.coursesModalNext.dataset.boundCoursesModal) {
            state.coursesModalNext.dataset.boundCoursesModal = 'true';
            state.coursesModalNext.addEventListener('click', (event) => {
                event.stopPropagation();
                navigateCoursesModal(1);
            });
        }

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

    const closeOpenSelectDropdowns = () => {
        document.querySelectorAll('.custom-select-container.open, .multi-select-container.open').forEach(el => el.classList.remove('open'));
        syncDropdownScrollLock();
    };

    const ensureGlobalEvents = (() => {
        let bound = false;
        return () => {
            if (bound) return;
            bound = true;

            document.addEventListener('keydown', (e) => {
                if (state.externalLinkModal && state.externalLinkModal.classList.contains('active')) {
                    if (e.key === 'Escape') closeExternalLinkModal(false);
                } else if (document.querySelector('.column-filter-header-flyout.open')) {
                    if (e.key === 'Escape') closeAllColumnFilterMenus();
                } else if (state.secModal && state.secModal.style.display === 'flex') {
                    if (state.currentToolsContext.length > 1) {
                        if (e.key === 'ArrowLeft') state.modalManager?.navigateTool(-1);
                        if (e.key === 'ArrowRight') state.modalManager?.navigateTool(1);
                    }
                    if (e.key === 'Escape') state.modalManager?.resetSecModal();
                } else if (state.coursesModal && state.coursesModal.style.display === 'flex' && state.coursesModal.classList.contains('courses-modal-over-modal')) {
                    const courseNavLen = getCoursesModalCourseList().length;
                    if (courseNavLen > 1) {
                        if (e.key === 'ArrowLeft') navigateCoursesModal(-1);
                        if (e.key === 'ArrowRight') navigateCoursesModal(1);
                    }
                    if (e.key === 'Escape') closeCoursesModal();
                } else if (state.modal && state.modal.style.display === 'flex') {
                    if (state.showModalNavArrows) {
                        if (e.key === 'ArrowLeft') state.modalManager?.navigateItem(-1);
                        if (e.key === 'ArrowRight') state.modalManager?.navigateItem(1);
                    }
                    if (e.key === 'Escape') state.modalManager?.resetModal();
                } else if (state.coursesModal && state.coursesModal.style.display === 'flex') {
                    const courseNavLen = getCoursesModalCourseList().length;
                    if (courseNavLen > 1) {
                        if (e.key === 'ArrowLeft') navigateCoursesModal(-1);
                        if (e.key === 'ArrowRight') navigateCoursesModal(1);
                    }
                    if (e.key === 'Escape') closeCoursesModal();
                }
            });

            document.addEventListener('click', (e) => {
                const clickedSelect = !!e.target.closest('.custom-select-container, .multi-select-container');
                const clickedColumnFilter = !!e.target.closest('.column-filter-menu, .column-filter-header-flyout, .filter-icon-button, .column-header-filter-indicator');
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
        if (route === '/technical') {
            if (!state.allData.skills) sheetsNeeded.push('skills');
            if (!state.allData['Course Projects']) sheetsNeeded.push('Course Projects');
        }
        if (route === '/courses') {
            if (!state.allData.Courses) sheetsNeeded.push('Courses');
            if (!state.allData['Course Projects']) sheetsNeeded.push('Course Projects');
            if (!state.allData.skills) sheetsNeeded.push('skills');
        }
        if (route === '/' || route === '/bio') {
            if (!state.allData.School) sheetsNeeded.push('School');
            if (!state.allData.Courses) sheetsNeeded.push('Courses');
            if (!state.allData['Course Projects']) sheetsNeeded.push('Course Projects');
            if (!state.allData.games) sheetsNeeded.push('games');
            if (!state.allData.videos) sheetsNeeded.push('videos');
            if (!state.allData.skills) sheetsNeeded.push('skills');
        }
        if (route === '/achievements') {
            if (!state.allData.videos) sheetsNeeded.push('videos');
            if (!state.allData.skills) sheetsNeeded.push('skills');
            if (!state.allData.Achievements) sheetsNeeded.push('Achievements');
            if (!state.allData.School) sheetsNeeded.push('School');
            if (!state.allData.Courses) sheetsNeeded.push('Courses');
            if (!state.allData['Course Projects']) sheetsNeeded.push('Course Projects');
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
                renderRecentWork();
            }

            if (state.currentRoute === '/activities') {
                renderActivities();
            }

            if (state.currentRoute === '/courses') {
                const allCoursesCount = normalizeCourses(data.Courses || []).length;
                setStoredCount(state.skeletonKey, allCoursesCount);
                renderCourses();
            }

            if ((data.Courses || []).length && (data.skills || []).length && state.modalManager) {
                preloadProgrammingLanguageIconsForCourses(data.Courses, data['Course Projects']).catch(() => { });
            }

            if (state.portfolioGrid) {
                const pageType = state.currentRoute === '/games' ? 'games' : 'videos';
                const projectData = data[pageType] || [];
                setStoredCount(state.skeletonKey, projectData.length);

                if (!isCached && (!state.didPrimeSkeletons || state.primedSkeletonTarget !== 'portfolio' || state.primedSkeletonCount !== projectData.length)) {
                    state.renderer.showSkeletons(state.portfolioGrid, projectData.length);
                }
                if (projectData.length > 0 && state.filterCards) {
                    state.filterCards();
                }

                if (projectData.length === 0) {
                    if (portfolioGridResizeObserver) {
                        portfolioGridResizeObserver.disconnect();
                        portfolioGridResizeObserver = null;
                    }
                    state.portfolioGrid.style.minHeight = '';
                    const emptyMsg = pageType === 'games'
                        ? 'No games match the current filters.'
                        : 'No videos match the current filters.';
                    state.portfolioGrid.innerHTML = `<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 40px;">${emptyMsg}</p>`;
                    if (state.filterCards) state.filterCards();
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
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    if (state.routeToken !== token) return;
                                    if (state.lockPortfolioGridHeight) state.lockPortfolioGridHeight();
                                    ensurePortfolioGridResizeObserver();
                                });
                            });
                        } catch (e) {
                            if (state.portfolioGrid) {
                                if (portfolioGridResizeObserver) {
                                    portfolioGridResizeObserver.disconnect();
                                    portfolioGridResizeObserver = null;
                                }
                                state.portfolioGrid.style.minHeight = '';
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
                    applyHiddenColumnsToTable('skills');
                    if (state.lockSkillsTableHeight) state.lockSkillsTableHeight();
                    bindSkillTableSortButtons();
                    if (state.syncSkillSortIndicators) state.syncSkillSortIndicators();
                    renderSkillColumnFilter();
                    if (state.filterSkills) state.filterSkills();
                });
            }

            if (state.currentRoute === '/technical' && data['Course Projects']) {
                preloadProgrammingLanguageIconsForCourses([], data['Course Projects']).catch(() => { });
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
        state.appendSoftwareLanguageTagsToContainer = appendSoftwareLanguageTagsToContainer;
        state.parseCourseLanguagesUsedRaw = parseCourseLanguagesUsedRaw;
        state.getAggregatedCourseProjectLanguagesForSkill = getAggregatedCourseProjectLanguagesForSkill;
        state.getCourseProjectRowsForSkill = getCourseProjectRowsForSkill;
        state.getCourseNameByCourseId = getCourseNameByCourseId;
        state.filterCards = () => state.filterManager.filterCards();
        state.filterSkills = () => state.filterManager.filterSkills();
        state.sortCards = () => state.filterManager.sortCards();
        state.sortSkills = () => state.filterManager.sortSkills();
        state.lockSkillsTableHeight = () => {
            const skillsShell = state.skillsList?.querySelector('.skills-table-shell') || document.querySelector('.courses-table-shell.skills-table-shell');
            lockTableShellHeight(skillsShell);
        };
        state.lockPortfolioGridHeight = () => lockTableShellHeight(state.portfolioGrid);
        state.lockCoursesTableHeight = () => {
            const coursesShell = state.coursesTableBody?.closest('.courses-table-shell');
            lockTableShellHeight(coursesShell);
        };
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

        if (!document.body.dataset.boundColumnHeaderFilterClick) {
            document.body.dataset.boundColumnHeaderFilterClick = 'true';
            document.addEventListener('click', (e) => {
                const indicator = e.target.closest('.column-header-filter-indicator');
                if (!indicator) return;
                if (indicator.classList.contains('is-disabled')) return;
                e.preventDefault();
                e.stopPropagation();

                const scope = indicator.dataset.filterScope || '';
                const key = indicator.dataset.filterKey || '';
                if (!scope || !key) return;

                const flyout = headerColumnFilterFlyoutEl;
                if (flyout && flyout.classList.contains('open')
                    && flyout.dataset.headerFilterScope === scope
                    && flyout.dataset.headerFilterKey === key) {
                    closeAllColumnFilterMenus();
                    syncDropdownScrollLock();
                    return;
                }

                if (indicator.classList.contains('is-active')) {
                    const selectedMap = scope === 'skills'
                        ? state.selectedSkillColumnValues
                        : scope === 'courses'
                            ? state.selectedCourseColumnValues
                            : scope === 'portfolio'
                                ? state.selectedPortfolioColumnValues
                                : null;
                    if (!selectedMap) return;
                    delete selectedMap[key];
                    if (scope === 'skills') {
                        if (state.filterSkills) state.filterSkills();
                        renderSkillColumnFilter();
                    } else if (scope === 'courses') {
                        if (state.applyCoursesFilterAndSort) state.applyCoursesFilterAndSort();
                        renderCoursesColumnFilter();
                    } else if (scope === 'portfolio') {
                        const selectedByColumn = state.selectedPortfolioColumnValues || {};
                        state.selectedCategories = Array.isArray(selectedByColumn.type) ? [...selectedByColumn.type] : ['all'];
                        state.selectedTools = Array.isArray(selectedByColumn.tools) ? [...selectedByColumn.tools] : ['all'];
                        if (!('type' in selectedByColumn)) state.selectedCategories = ['all'];
                        if (!('tools' in selectedByColumn)) state.selectedTools = ['all'];
                        if (state.filterCards) state.filterCards();
                        const pageType = state.currentRoute === '/games' ? 'games' : 'videos';
                        const list = Array.isArray(state.allData?.[pageType]) ? state.allData[pageType] : [];
                        renderPortfolioColumnFilter(list);
                    }
                    closeAllColumnFilterMenus();
                    return;
                }

                openHeaderColumnFilterFlyout(scope, key, indicator);
            }, true);
        }

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
