document.addEventListener('DOMContentLoaded', () => {
    const routes = {
        '/': { fragment: 'html/pages/bio.html', title: 'BIO' },
        '/bio': { fragment: 'html/pages/bio.html', title: 'BIO' },
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
                if (result.ok) return { src: thumbSrc, cached: result.cached };
            }
            
            return { src: `https://img.youtube.com/vi/${youtubeID}/default.jpg`, cached: false };
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

            let modalMousedownTarget = null;
            
            window.addEventListener('mousedown', (event) => {
                modalMousedownTarget = event.target;
            });
            
            window.onclick = function (event) {
                if (event.target === state.modal && modalMousedownTarget === state.modal) {
                    state.modalManager?.resetModal();
                } else if (event.target === state.secModal && modalMousedownTarget === state.secModal) {
                    state.modalManager?.resetSecModal();
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
        if (route === '/achievements') {
            if (!state.allData.videos) sheetsNeeded.push('videos');
            if (!state.allData.skills) sheetsNeeded.push('skills');
        }
        
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
                    setupAchievementVideoLinks(data.videos || []);
                    renderAchievementAwards();
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
    
    window.navigateTo = navigate;

    updateNavLinks();
    updateNavActive(resolveRoute(window.location.pathname));
    ensureGlobalEvents();
    
    if (typeof initializeGlobalSearch === 'function') {
        initializeGlobalSearch();
    }

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
