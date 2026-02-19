document.addEventListener('DOMContentLoaded', () => {
    const state = {
        modal: document.getElementById("infoModal"),
        closeBtn: document.querySelector(".close-button"),
        videoFrame: document.getElementById("modal-video"),
        mediaContainer: document.getElementById("media-container"),
        prevBtn: document.getElementById("modal-prev"),
        nextBtn: document.getElementById("modal-next"),
        secModal: document.getElementById("secondaryModal"),
        secCloseBtn: document.querySelector(".sec-close-button"),
        secPrevBtn: document.getElementById("sec-modal-prev"),
        secNextBtn: document.getElementById("sec-modal-next"),
        skillsList: document.getElementById('skills-list'),
        achievementsList: document.getElementById('achievements-list'),
        portfolioGrid: document.getElementById("portfolio-grid"),
        noResults: document.getElementById("no-results"),
        toolSelectContainer: document.getElementById('tool-select'),
        typeSelectContainer: document.getElementById('type-select'),
        sortSelectContainer: document.getElementById('sort-select'),
        orderSelectContainer: document.getElementById('order-select'),
        searchContainer: document.querySelector('.search-box'),
        searchInput: document.getElementById("portfolio-search"),

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

        openModalForItem: null,
        filterCards: null,
        filterSkills: null,
        sortCards: null,
        sortSkills: null,
        updateTypeFilter: null,
        updateToolFilter: null,
        runFiltering: null,
    };

    state.isSkillsPage = !!state.skillsList;
    state.isAchievementsPage = !!state.achievementsList;
    state.isPortfolioPage = !!state.portfolioGrid;
    state.selectedSort = state.isSkillsPage ? 'lastUsed' : 'date';

    

    const modal = new ModalManager(state);
    const filter = new FilterManager(state);
    const controls = new ControlsManager(state);
    const renderer = new Renderer(state);
    const dataService = new DataService('12V7XnylQtfLmT1ux5Va-DPhKc201m3fht9JstupnHdk');

    state.openModalForItem = (...args) => modal.openModalForItem(...args);
    state.filterCards = () => filter.filterCards();
    state.filterSkills = () => filter.filterSkills();
    state.sortCards = () => filter.sortCards();
    state.sortSkills = () => filter.sortSkills();
    state.updateTypeFilter = (cats) => controls.updateTypeFilter(cats);
    state.updateToolFilter = (tools) => controls.updateToolFilter(tools);
    state.runFiltering = () => filter.runFiltering();

    async function includeHTML() {
        const elements = document.querySelectorAll('[data-include]');
        for (const el of elements) {
            const file = el.getAttribute('data-include');
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const content = await response.text();
                    el.innerHTML = content;
                    if (file.includes('nav.html')) setupNavigation();
                    if (file.includes('footer.html')) setTimeout(() => dataService.fetchLastUpdated(), 50);
                }
            } catch (err) {
                console.error("Error loading include:", err);
            }
        }
    }

    function setupAchievementVideoLinks(projects) {
        if (!projects || !projects.length) return;
        const anchors = Array.from(document.querySelectorAll('.achievement-card a'));
                const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
                anchors.forEach(a => {
                    try {
                        const projectNameAttr = a.getAttribute('data-project');
                        const href = a.getAttribute('href') || '';
                        if (!projectNameAttr && (!href.toLowerCase().includes('videos.html') || !href.includes('?search='))) return;
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
                                state.openModalForItem(match);
                            } else {
                                    if (href && href !== '#') window.location.href = href;
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
    }

    function setupNavigation() {
        const path = window.location.pathname;
        const page = path.split("/").pop() || "index.html";
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
            if (link.getAttribute('href') === page) link.classList.add('active');
        });
    }

    

    includeHTML();
    controls.initControlSkeletons();
    controls.renderStaticControls();

    if (state.closeBtn) state.closeBtn.onclick = () => modal.resetModal();
    if (state.secCloseBtn) state.secCloseBtn.onclick = () => modal.resetSecModal();
    if (state.secPrevBtn) state.secPrevBtn.onclick = (e) => { e.stopPropagation(); modal.navigateTool(-1); };
    if (state.secNextBtn) state.secNextBtn.onclick = (e) => { e.stopPropagation(); modal.navigateTool(1); };

    if (state.prevBtn) {
        state.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.navigateItem(-1);
        });
    }
    if (state.nextBtn) {
        state.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.navigateItem(1);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (state.secModal && state.secModal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') modal.navigateTool(-1);
            if (e.key === 'ArrowRight') modal.navigateTool(1);
            if (e.key === 'Escape') modal.resetSecModal();
        } else if (state.modal && state.modal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') modal.navigateItem(-1);
            if (e.key === 'ArrowRight') modal.navigateItem(1);
            if (e.key === 'Escape') modal.resetModal();
        }
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
    });

    window.addEventListener('scroll', () => {
        document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
    }, { passive: true });

    

    window.onclick = function (event) {
        if (event.target === state.modal) modal.resetModal();
        else if (event.target === state.secModal) modal.resetSecModal();
    };

    dataService.loadAllData()
        .then(data => {
            state.allData = data;
            if (document.querySelector('.achievement-card')) setupAchievementVideoLinks(data.videos || []);
            const dateElement = document.getElementById("last-updated-date");
            if (dateElement && data.lastUpdated) dateElement.innerText = data.lastUpdated;

            if (state.portfolioGrid) {
                const path = window.location.pathname.toLowerCase();
                let pageType = 'videos';
                if (path.includes('games')) pageType = 'games';
                else if (path.includes('videos')) pageType = 'videos';
                else if (document.title.toLowerCase().includes('game')) pageType = 'games';

                const projectData = data[pageType] || [];
                renderer.showSkeletons(state.portfolioGrid, projectData.length);

                if (projectData.length === 0) {
                    state.portfolioGrid.innerHTML = `<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 40px;">No projects found for "${pageType}".</p>`;
                }

                setTimeout(() => {
                    try {
                        renderer.renderProjects(projectData);
                    } catch (e) {
                        console.error("Render error:", e);
                    }
                }, 300);
            }

            if (state.skillsList) {
                const skillData = data.skills || [];
                const isAchievements = window.location.pathname.includes('achievements.html');
                const dynamicCount = isAchievements ? skillData.filter(s => s.certified === true).length : skillData.length;
                renderer.showSkeletons(state.skillsList, dynamicCount);
                setTimeout(() => {
                    renderer.renderSkills(skillData);
                }, 400);
            }
        })
        .catch(err => console.error("Error loading data:", err));
});
