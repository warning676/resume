document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("infoModal");
    const closeBtn = document.querySelector(".close-button");
    const videoFrame = document.getElementById("modal-video");
    const mediaContainer = document.getElementById("media-container");
    const prevBtn = document.getElementById("modal-prev");
    const nextBtn = document.getElementById("modal-next");
    const sortSelect = document.getElementById("sort-select");
    const orderSelect = document.getElementById("order-select");
    const searchInput = document.getElementById("portfolio-search");
    const typeSelect = document.getElementById('type-select');
    const skillsList = document.getElementById('skills-list');
    const achievementsList = document.getElementById('achievements-list');
    const portfolioGrid = document.getElementById("portfolio-grid");
    const noResults = document.getElementById("no-results");
    const toolSelectContainer = document.getElementById('tool-select');
    const typeSelectContainer = document.getElementById('type-select');
    const sortSelectContainer = document.getElementById('sort-select');
    const orderSelectContainer = document.getElementById('order-select');
    const searchContainer = document.querySelector('.search-box');

    let isSkillsPage = !!skillsList;
    let isAchievementsPage = !!achievementsList;
    let isPortfolioPage = !!portfolioGrid;

    let selectedCategories = ['all'];
    let selectedTools = ['all'];
    let selectedSort = isSkillsPage ? 'lastUsed' : 'date';
    let selectedOrder = 'desc';
    let searchQuery = '';
    let currentItemCard = null;
    let currentGalleryIndex = 0;
    let allData = null;

    const resetModal = () => {
        if (modal) modal.style.display = "none";
        if (videoFrame) videoFrame.src = "";
        const ex = document.getElementById("big-image-view"); if (ex) ex.remove();
        if (document.querySelector(".modal-body-split")) document.querySelector(".modal-body-split").scrollTop = 0;
        if (document.querySelector(".modal-content")) document.querySelector(".modal-content").scrollTop = 0;
        const gal = document.getElementById("modal-gallery"); if (gal) gal.scrollLeft = 0;
        currentItemCard = null;
    };

    const resetSecModal = () => {
        if (secModal) secModal.style.display = "none";
        currentToolsContext = [];
        currentToolIndex = -1;
    };

    includeHTML();

    async function includeHTML() {
        const elements = document.querySelectorAll('[data-include]');
        for (const el of elements) {
            const file = el.getAttribute('data-include');
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const content = await response.text();
                    el.innerHTML = content;

                    if (file.includes('nav.html')) {
                        setupNavigation();
                    }
                    if (file.includes('footer.html')) {
                        setTimeout(fetchLastUpdated, 50);
                    }
                }
            } catch (err) {
                console.error("Error loading include:", err);
            }
        }
    }

    function setupNavigation() {
        const path = window.location.pathname;
        const page = path.split("/").pop() || "index.html";
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
            if (link.getAttribute('href') === page) {
                link.classList.add('active');
            }
        });
    }

    function navigateItem(direction) {
        if (!currentItemCard) return;

        let container;
        let itemSelector;

        if (isSkillsPage) {
            container = skillsList;
            itemSelector = '.skill-item';
        } else if (isPortfolioPage) {
            container = portfolioGrid;
            itemSelector = '.portfolio-card';
        } else if (isAchievementsPage) {
            container = achievementsList;
            itemSelector = '.achievement-card';
        } else return;

        const allItems = Array.from(container.querySelectorAll(itemSelector));
        const visibleItems = allItems.filter(item => item.style.display !== 'none');

        if (visibleItems.length <= 1) return;

        const currentIndex = visibleItems.indexOf(currentItemCard);
        let nextIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;

        currentItemCard = visibleItems[nextIndex];
        openModalForItem(currentItemCard);
    }

    const secModal = document.getElementById("secondaryModal");
    const secCloseBtn = document.querySelector(".sec-close-button");
    const secPrevBtn = document.getElementById("sec-modal-prev");
    const secNextBtn = document.getElementById("sec-modal-next");

    let currentToolsContext = [];
    let currentToolIndex = -1;

    function openModalForItem(cardOrData, typeOverride = null, toolsContext = null) {
        const isSkill = (cardOrData instanceof HTMLElement) ? (cardOrData.classList.contains('skill-item')) : (typeOverride === 'skill');
        const data = (cardOrData instanceof HTMLElement) ? cardOrData.dataset : cardOrData;

        const useSecondary = isSkill && modal && modal.style.display === "flex" && secModal && toolsContext;
        const targetModal = useSecondary ? secModal : modal;
        const prefix = useSecondary ? "sec-" : "";

        if (useSecondary && toolsContext) {
            currentToolsContext = toolsContext;
            currentToolIndex = currentToolsContext.findIndex(toolName => toolName.toLowerCase() === data.name.toLowerCase());
        }

        if (!useSecondary) {
            currentGalleryIndex = 0;
            const modalBody = document.querySelector(".modal-body-split");
            const modalContent = document.querySelector(".modal-content");
            if (modalBody) modalBody.scrollTop = 0;
            if (modalContent) modalContent.scrollTop = 0;

            const container = isSkillsPage ? skillsList : portfolioGrid;
            const itemSelector = isSkillsPage ? '.skill-item' : '.portfolio-card';

            currentItemCard = (cardOrData instanceof HTMLElement) ? cardOrData : null;
            const visibleItems = container ? Array.from(container.querySelectorAll(itemSelector))
                .filter(item => item.style.display !== 'none') : [];

            if (prevBtn) prevBtn.style.visibility = (currentItemCard && visibleItems.length > 1) ? 'visible' : 'hidden';
            if (nextBtn) nextBtn.style.visibility = (currentItemCard && visibleItems.length > 1) ? 'visible' : 'hidden';

            let gallery = document.getElementById("modal-gallery");
            if (gallery && gallery.parentElement.classList.contains('gallery-container-wrapper')) {
                const wrapper = gallery.parentElement;
                wrapper.parentNode.insertBefore(gallery, wrapper);
                wrapper.remove();
            }
            if (gallery) {
                gallery.innerHTML = '';
                gallery.scrollLeft = 0;
            }
        }

        if (isSkill) {
            targetModal.classList.add('modal-skill');
            const pHeader = document.getElementById(prefix + 'project-header');
            const sHeader = document.getElementById(prefix + 'skill-header');
            const pInfo = document.getElementById(prefix + 'project-info');
            const sInfo = document.getElementById(prefix + 'skill-info');
            const mMedia = targetModal.querySelector('.modal-media-pane');

            if (pHeader) pHeader.style.display = 'none';
            if (sHeader) sHeader.style.display = 'flex';
            if (pInfo) pInfo.style.display = 'none';
            if (sInfo) sInfo.style.display = 'block';
            if (mMedia) mMedia.style.display = 'none';

            if (!useSecondary) {
                const mTools = targetModal.querySelector('.modal-info-pane > div:last-child');
                if (mTools) mTools.style.display = 'none';
            }

            const titleMain = document.getElementById(prefix + 'modal-title-main');
            if (titleMain) {
                titleMain.innerText = data.name.toUpperCase().trim();
            }

            const bioDesc = document.getElementById(prefix + 'bio-description');
            if (bioDesc) bioDesc.innerText = data.info || "No description available.";

            const modalIcon = document.getElementById(prefix + 'modal-skill-icon');
            if (modalIcon) {
                modalIcon.src = data.icon || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('img').src : "");
                modalIcon.alt = data.name;
            }

            const sType = document.getElementById(prefix + 'modal-skill-type');
            if (sType) sType.innerText = data.badge || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('.type-badge').innerText : "");

            const sLevel = document.getElementById(prefix + 'modal-skill-level');
            if (sLevel) sLevel.innerText = data.level || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('.level').innerText : "-");

            const sLast = document.getElementById(prefix + 'modal-skill-last');
            if (sLast) sLast.innerText = data.lastUsed || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('.last-used').innerText : "-");

            const certContainer = document.getElementById(prefix + 'modal-skill-cert-container');
            const certName = document.getElementById(prefix + 'modal-skill-cert-name');
            if (certContainer && certName) {
                const isCertified = data.certified === "true" || data.certified === true;
                if (isCertified && data.certName) {
                    certContainer.style.display = "block";
                    certName.innerText = data.certName;
                } else {
                    certContainer.style.display = "none";
                    certName.innerText = "-";
                }
            }

            if (useSecondary) {
                if (secPrevBtn) secPrevBtn.style.display = (currentToolsContext.length > 1) ? 'flex' : 'none';
                if (secNextBtn) secNextBtn.style.display = (currentToolsContext.length > 1) ? 'flex' : 'none';
            } else {
                if (videoFrame) videoFrame.style.display = 'none';
                const bigImg = document.getElementById("big-image-view");
                if (bigImg) bigImg.remove();
            }
        } else {
            targetModal.classList.remove('modal-skill');
            const pHeader = document.getElementById('project-header');
            const sHeader = document.getElementById('skill-header');
            const pInfo = document.getElementById('project-info');
            const sInfo = document.getElementById('skill-info');
            const mMedia = targetModal.querySelector('.modal-media-pane');
            const mTools = targetModal.querySelector('.modal-info-pane > div:last-child');

            if (pHeader) pHeader.style.display = 'block';
            if (sHeader) sHeader.style.display = 'none';
            if (pInfo) pInfo.style.display = 'block';
            if (sInfo) sInfo.style.display = 'none';
            if (mMedia) mMedia.style.display = 'block';
            if (mTools) mTools.style.display = 'block';

            const youtubeID = data.youtube;
            const galleryData = data.gallery;
            const rawDate = data.date;
            const toolsStr = data.tools;
            const info = data.info;

            const modalTitle = document.getElementById("modal-title");
            if (modalTitle) modalTitle.innerText = data.name.toUpperCase();

            const infoTitle = document.getElementById("modal-info-title");
            if (infoTitle) infoTitle.innerText = data.name.toUpperCase();

            const infoCategory = document.getElementById("modal-info-category");
            if (infoCategory) {
                infoCategory.innerText = (data.badge || "").toUpperCase();
                infoCategory.style.display = data.badge ? "block" : "none";
            }

            const modalTools = document.getElementById("modal-tools");
            if (modalTools) {
                modalTools.innerHTML = '';
                if (toolsStr) {
                    const tools = toolsStr.split(',').map(s => s.trim());
                    tools.forEach(tool => {
                        const tag = document.createElement('span');
                        tag.className = 'software-tag';

                        const skillMatch = allData && allData.skills ? allData.skills.find(s => s.name.toLowerCase() === tool.toLowerCase()) : null;

                        if (skillMatch && skillMatch.icon) {
                            const icon = document.createElement('img');
                            icon.src = skillMatch.icon;
                            icon.style.width = "14px";
                            icon.style.height = "14px";
                            icon.style.marginRight = "6px";
                            icon.style.objectFit = "contain";
                            icon.style.verticalAlign = "middle";
                            tag.appendChild(icon);
                        }

                        const text = document.createElement('span');
                        text.innerText = tool.toUpperCase();
                        tag.appendChild(text);

                        if (skillMatch) {
                            tag.classList.add('clickable-tool');
                            tag.title = `View details for ${tool}`;
                            tag.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const tools = toolsStr.split(',').map(s => s.trim());
                                openModalForItem(skillMatch, 'skill', tools);
                            });
                        }
                        modalTools.appendChild(tag);
                    });
                } else {
                    modalTools.innerText = "NONE";
                }
            }

            const modalDesc = document.getElementById("modal-description");
            if (modalDesc) modalDesc.innerText = info;

            const modalDate = document.getElementById("modal-date");
            if (modalDate) modalDate.innerText = formatFullDate(rawDate).toUpperCase();

            if (youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE") {
                showVideo(youtubeID);
                if (videoFrame) videoFrame.style.display = 'block';
            } else {
                if (videoFrame) {
                    videoFrame.style.display = 'none';
                    videoFrame.src = "";
                }
                const firstImg = galleryData ? galleryData.split(',')[0].trim() : "";
                if (firstImg) showImage(firstImg);
            }

            if (galleryData) {
                const images = galleryData.split(',').map(s => s.trim());
                let gallery = document.getElementById("modal-gallery");
                const mPrev = document.getElementById("gallery-prev");
                const mNext = document.getElementById("gallery-next");

                const updateSelection = (index) => {
                    const items = Array.from(gallery.children).filter(child =>
                        child.tagName === 'IMG' || child.classList.contains('video-thumb-btn')
                    );
                    items.forEach((item, i) => {
                        if (i === index) item.classList.add('selected');
                        else item.classList.remove('selected');
                    });
                };

                const hasVideo = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";
                let galleryIndexOffset = 0;

                if (hasVideo) {
                    const videoBtn = document.createElement('button');
                    videoBtn.className = 'video-thumb-btn selected';
                    videoBtn.innerHTML = `
                        <img src="https://img.youtube.com/vi/${youtubeID}/mqdefault.jpg" alt="Video Thumbnail">
                        <div class="video-overlay">
                            <span class="video-play-icon">▶</span>
                            <span class="video-label">VIDEO</span>
                        </div>
                    `;
                    videoBtn.addEventListener('click', () => {
                        currentGalleryIndex = 0;
                        updateSelection(0);
                        centerItemInGallery(gallery, videoBtn);
                        showVideo(youtubeID);
                        updateGalleryButtons(gallery, mPrev, mNext);
                    });
                    gallery.appendChild(videoBtn);
                    galleryIndexOffset = 1;
                }

                images.forEach((src, idx) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = `Screenshot ${idx + 1}`;
                    const myIndex = idx + galleryIndexOffset;

                    if (!hasVideo && idx === 0) img.classList.add('selected');

                    img.addEventListener('click', () => {
                        currentGalleryIndex = myIndex;
                        updateSelection(myIndex);
                        centerItemInGallery(gallery, img);
                        showImage(src);
                        updateGalleryButtons(gallery, mPrev, mNext);
                    });
                    gallery.appendChild(img);
                });

                initGalleryDrag(gallery);

                if (gallery.children.length > 1) {
                    const gPrev = document.createElement('button');
                    gPrev.id = "gallery-prev";
                    gPrev.className = "gallery-nav-btn prev";
                    gPrev.innerHTML = "&#10094;";
                    gPrev.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigateGallery(gallery, -1, gPrev, gNext);
                    });

                    const gNext = document.createElement('button');
                    gNext.id = "gallery-next";
                    gNext.className = "gallery-nav-btn next";
                    gNext.innerHTML = "&#10095;";
                    gNext.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigateGallery(gallery, 1, gPrev, gNext);
                    });

                    const wrapper = document.createElement('div');
                    wrapper.className = 'gallery-container-wrapper';
                    gallery.parentNode.insertBefore(wrapper, gallery);
                    wrapper.appendChild(gPrev);
                    wrapper.appendChild(gallery);
                    wrapper.appendChild(gNext);

                    updateGalleryButtons(gallery, gPrev, gNext);
                }
            }
        }
        if (targetModal) targetModal.style.display = "flex";
    }

    if (secCloseBtn) secCloseBtn.onclick = resetSecModal;

    function navigateTool(direction) {
        if (!currentToolsContext.length) return;
        currentToolIndex = (currentToolIndex + direction + currentToolsContext.length) % currentToolsContext.length;
        const nextToolName = currentToolsContext[currentToolIndex];
        const skillMatch = allData && allData.skills ? allData.skills.find(s => s.name.toLowerCase() === nextToolName.toLowerCase()) : null;
        if (skillMatch) {
            openModalForItem(skillMatch, 'skill', currentToolsContext);
        }
    }

    if (secPrevBtn) secPrevBtn.onclick = (e) => { e.stopPropagation(); navigateTool(-1); };
    if (secNextBtn) secNextBtn.onclick = (e) => { e.stopPropagation(); navigateTool(1); };

    function navigateGallery(gallery, direction, gPrev, gNext) {
        const items = Array.from(gallery.children).filter(child => !child.classList.contains('gallery-nav-btn'));
        if (items.length === 0) return;

        let newIndex = currentGalleryIndex + direction;

        if (newIndex >= items.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = items.length - 1;
        }

        currentGalleryIndex = newIndex;
        const targetItem = items[currentGalleryIndex];
        targetItem.click();
        centerItemInGallery(gallery, targetItem);
        updateGalleryButtons(gallery, gPrev, gNext);
    }

    function updateGalleryButtons(gallery, gPrev, gNext) {
        if (!gPrev || !gNext) return;
        const items = Array.from(gallery.children).filter(child => !child.classList.contains('gallery-nav-btn'));
        const shouldShow = items.length > 1;
        gPrev.style.visibility = shouldShow ? 'visible' : 'hidden';
        gNext.style.visibility = shouldShow ? 'visible' : 'hidden';
    }

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateItem(-1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateItem(1);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (secModal && secModal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') navigateTool(-1);
            if (e.key === 'ArrowRight') navigateTool(1);
            if (e.key === 'Escape') resetSecModal();
        } else if (modal && modal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') navigateItem(-1);
            if (e.key === 'ArrowRight') navigateItem(1);
            if (e.key === 'Escape') resetModal();
        }
    });

    async function fetchLastUpdated() {
        const dateElement = document.getElementById('last-updated-date');
        if (!dateElement) return;

        try {
            const response = await fetch('https://api.github.com/repos/warning676/resume/commits/main');
            const data = await response.json();
            const date = new Date(data.commit.committer.date);
            dateElement.textContent = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (err) {
            dateElement.textContent = "Recently";
        }
    }

    function checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const initialSearch = urlParams.get('search');

        if (initialSearch && searchInput) {
            searchInput.value = decodeURIComponent(initialSearch);

            if (portfolioGrid) filterCards();
            if (skillsList) filterSkills();

            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function formatFullDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString.replace(/-/g, '\/'));
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    const showSkeletons = (container, count) => {
        if (!container) return;
        const isPortfolioGrid = container.id === 'portfolio-grid';
        const isSkillsGrid = container.id === 'skills-list';

        container.style.visibility = 'visible';
        container.style.display = isPortfolioGrid ? 'grid' : 'block';

        if (isSkillsGrid) {
            container.innerHTML = '<div class="grid-structure grid-header"><span>Skill</span><span>Proficiency</span><span>Last Used</span></div>';
        } else {
            container.innerHTML = '';
        }

        let skeletonContent = '';
        if (isSkillsGrid) {
            skeletonContent = `
                <div class="grid-structure skill-item skeleton-item">
                    <div class="skeleton-element" style="width: 32px; height: 32px; border-radius: 4px;"></div>
                    <div class="skill-meta">
                        <div class="skeleton-element" style="width: 120px; height: 14px; margin-bottom: 6px; border-radius: 4px;"></div>
                        <div class="skeleton-element" style="width: 70px; height: 10px; border-radius: 4px;"></div>
                    </div>
                    <div class="skeleton-element" style="width: 90px; height: 14px; border-radius: 4px;"></div>
                    <div class="skeleton-element" style="width: 70px; height: 14px; border-radius: 4px;"></div>
                </div>`;
        } else if (isPortfolioGrid) {
            skeletonContent = `
                <div class="portfolio-card skeleton-item">
                    <div class="card-thumb"><div class="skeleton-element" style="width: 100%; height: 100%;"></div></div>
                    <div class="card-content">
                        <div class="skeleton-element" style="width: 80%; height: 18px; margin-bottom: 10px; border-radius: 4px;"></div>
                        <div class="skeleton-element" style="width: 40%; height: 14px; border-radius: 4px;"></div>
                    </div>
                </div>`;
        }
        for (let i = 0; i < count; i++) {
            container.insertAdjacentHTML('beforeend', skeletonContent);
        }
    };

    function getProficiencyValue(level) {
        const scores = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
        return scores[level] || 0;
    }

    const runFiltering = () => {
        if (searchInput) {
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    window.addEventListener('popstate', () => {
        const newParams = new URLSearchParams(window.location.search);
        const newSearch = newParams.get('search');
        if (searchInput) {
            searchInput.value = newSearch ? decodeURIComponent(newSearch) : '';
            runFiltering();
        }
    });

    fetch('projects.json')
        .then(response => {
            if (!response.ok) throw new Error("Could not fetch projects.json");
            return response.json();
        })
        .then(data => {
            allData = data;
            const dateElement = document.getElementById("last-updated-date");
            if (dateElement && data.lastUpdated) dateElement.innerText = data.lastUpdated;

            if (portfolioGrid) {
                const path = window.location.pathname.toLowerCase();
                let pageType = 'videos';
                if (path.includes('games')) pageType = 'games';
                else if (path.includes('videos')) pageType = 'videos';
                else if (document.title.toLowerCase().includes('game')) pageType = 'games';

                let projectData = data[pageType] || [];

                if (projectData.length === 0) {
                    if (pageType === 'videos' && data.games && data.games.length > 0) {
                    }
                }

                showSkeletons(portfolioGrid, projectData.length);

                if (projectData.length === 0) {
                    portfolioGrid.innerHTML = `<p style="color: #8b949e; grid-column: 1/-1; text-align: center; padding: 40px;">No projects found for "${pageType}".</p>`;
                }

                setTimeout(() => {
                    try {
                        renderProjects(projectData);
                        checkURLParams();
                    } catch (e) {
                        console.error("Render error:", e);
                    }
                }, 300);
            }

            if (skillsList) {
                const skillData = data.skills || [];
                const isAchievements = window.location.pathname.includes('achievements.html');
                const dynamicCount = isAchievements ? skillData.filter(s => s.certified === true).length : skillData.length;
                showSkeletons(skillsList, dynamicCount);
                setTimeout(() => {
                    renderSkills(skillData);
                    checkURLParams();
                }, 400);
            }
        })
        .catch(err => console.error("Error loading data:", err));

    function renderProjects(projects) {
        if (!portfolioGrid || !projects) return;
        portfolioGrid.innerHTML = '';
        projects.forEach(project => {
            try {
                const card = document.createElement('div');
                card.className = 'portfolio-card';
                card.setAttribute('data-name', project.name || '');
                card.setAttribute('data-date', project.date || '');
                card.setAttribute('data-info', project.info || '');
                card.setAttribute('data-tools', project.tools || '');
                card.setAttribute('data-youtube', project.youtube || '');
                card.setAttribute('data-type', project.type || '');
                card.setAttribute('data-badge', project.badge || '');
                card.setAttribute('data-gallery', project.gallery ? project.gallery.join(', ') : '');

                let thumbSrc = project.gallery?.[0] || '';
                const youtubeID = project.youtube;
                const hasValidYoutube = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";

                if (hasValidYoutube) {
                    thumbSrc = `https://img.youtube.com/vi/${youtubeID}/maxresdefault.jpg`;
                }

                const displayDate = project.date ? formatFullDate(project.date).toUpperCase() : "";
                const badgeHTML = project.badge ? `<span class="type-badge" style="margin-top: 10px; display: block;">${project.badge}</span>` : '';
                card.innerHTML = `
                    <div class="card-thumb">
                        <img src="${thumbSrc}" alt="${project.name}" onerror="if(this.src.includes('maxresdefault')){this.src='https://img.youtube.com/vi/${youtubeID}/hqdefault.jpg';}else{this.style.display='none';}">
                    </div>
                    <div class="card-content">
                        <h4>${(project.name || '').toUpperCase()}</h4>
                        <p>${displayDate}</p>
                        ${badgeHTML}
                    </div>`;
                card.addEventListener('click', () => openModalForItem(card));
                portfolioGrid.appendChild(card);
            } catch (err) {
                console.error("Error individual card:", project.name, err);
            }
        });

        const categories = new Map();
        const toolsMap = new Map();
        projects.forEach(project => {
            if (project.type && project.badge) {
                categories.set(project.type, project.badge);
            }
            if (project.tools) {
                project.tools.split(',').forEach(tool => {
                    const trimmed = tool.trim();
                    if (trimmed) toolsMap.set(trimmed, trimmed);
                });
            }
        });
        updateTypeFilter(categories);
        updateToolFilter(toolsMap);

        sortCards();
    }

    function renderSkills(skills) {
        if (!skillsList || !skills) return;
        const isAchievementsPage = window.location.pathname.includes('achievements.html');

        skillsList.innerHTML = '<div class="grid-structure grid-header"><span>Skill</span><span>Proficiency</span><span>Last Used</span></div>';

        const categories = new Map();

        skills.forEach(skill => {
            if (isAchievementsPage && !skill.certified) return;

            if (skill.type && skill.badge) {
                categories.set(skill.type, skill.badge);
            }

            const item = document.createElement('div');
            item.className = 'grid-structure skill-item';
            item.setAttribute('data-type', skill.type || '');
            item.setAttribute('data-name', skill.name);
            item.setAttribute('data-info', skill.info || '');
            item.setAttribute('data-certified', skill.certified ? "true" : "false");
            item.setAttribute('data-cert-name', skill.certName || "");
            item.setAttribute('data-badge', skill.badge || "");

            const certifiedBadge = skill.certified ? `<span class="grid-certified-badge">CERTIFIED</span>` : '';

            item.innerHTML = `
                <img src="${skill.icon}" class="skill-icon">
                <span class="skill-meta">
                    <span class="skill-name">${certifiedBadge}${skill.name}</span>
                    <span class="type-badge">${skill.badge}</span>
                </span>
                <span class="level">${skill.level}</span>
                <span class="last-used">${skill.lastUsed}</span>`;

            item.addEventListener('click', () => openModalForItem(item));
            skillsList.appendChild(item);
        });

        updateTypeFilter(categories);

        if (!isAchievementsPage) sortSkills();
    }

    function updateTypeFilter(categories) {
        if (typeSelectContainer) {
            const sortedCategories = Array.from(categories.entries()).sort((a, b) => a[1].localeCompare(b[1]));
            const options = sortedCategories.map(([id, label]) => ({ id, label }));

            if (options.length > 1 && !options.find(o => o.id === 'all')) {
                options.unshift({ id: 'all', label: 'All Categories' });
            }

            if (selectedCategories.includes('all') && !options.find(o => o.id === 'all') && options.length > 0) {
                selectedCategories = [options[0].id];
            }

            renderMultiSelect(typeSelectContainer, options, selectedCategories, (newSelected) => {
                selectedCategories = newSelected;
                if (isSkillsPage) filterSkills();
                else filterCards();
            });
        }
    }

    function updateToolFilter(toolsMap) {
        if (toolSelectContainer) {
            const sortedTools = Array.from(toolsMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
            const options = sortedTools.map(([id, label]) => ({ id, label }));

            if (options.length > 1 && !options.find(o => o.id === 'all')) {
                options.unshift({ id: 'all', label: 'All Tools' });
            }

            if (selectedTools.includes('all') && !options.find(o => o.id === 'all') && options.length > 0) {
                selectedTools = [options[0].id];
            }

            renderMultiSelect(toolSelectContainer, options, selectedTools, (newSelected) => {
                selectedTools = newSelected;
                filterCards();
            });
        }
    }

    function renderMultiSelect(container, options, selectedValues, onChange) {
        const wasOpen = container.classList.contains('open');
        container.innerHTML = '';
        container.className = 'multi-select-container' + (wasOpen ? ' open' : '');

        const trigger = document.createElement('div');
        trigger.className = 'multi-select-trigger';

        const updateTriggerText = () => {
            if (selectedValues.includes('all')) {
                trigger.textContent = options.find(o => o.id === 'all')?.label || 'All';
            } else if (selectedValues.length === 0) {
                trigger.textContent = 'None Selected';
            } else if (selectedValues.length === 1) {
                const opt = options.find(o => o.id === selectedValues[0]);
                trigger.textContent = opt ? opt.label : selectedValues[0];
            } else {
                trigger.textContent = `${selectedValues.length} Selected`;
            }
        };
        updateTriggerText();

        const dropdown = document.createElement('div');
        dropdown.className = 'multi-select-dropdown';

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'multi-select-item';
            if (selectedValues.includes(opt.id)) item.classList.add('selected');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedValues.includes(opt.id);

            const label = document.createElement('span');
            label.textContent = opt.label;

            item.appendChild(checkbox);
            item.appendChild(label);

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const isSelected = selectedValues.includes(opt.id);

                if (opt.id === 'all') {
                    selectedValues.length = 0;
                    selectedValues.push('all');
                } else {
                    const allIdx = selectedValues.indexOf('all');
                    if (allIdx > -1) selectedValues.splice(allIdx, 1);

                    if (isSelected) {
                        const hasAllOption = options.some(o => o.id === 'all');
                        if (selectedValues.length > 1 || hasAllOption) {
                            const idx = selectedValues.indexOf(opt.id);
                            if (idx > -1) selectedValues.splice(idx, 1);
                        }
                    } else {
                        selectedValues.push(opt.id);
                    }

                    if (selectedValues.length === 0 && options.some(o => o.id === 'all')) {
                        selectedValues.push('all');
                    }
                }

                renderMultiSelect(container, options, selectedValues, onChange);
                onChange(selectedValues);
            });

            dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = container.classList.contains('open');
            document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => {
                if (c !== container) c.classList.remove('open');
            });
            container.classList.toggle('open');
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
    });

    function renderSingleSelect(container, options, initialValue, onChange) {
        if (!container) return;
        const wasOpen = container.classList.contains('open');
        container.innerHTML = '';
        container.className = 'custom-select-container' + (wasOpen ? ' open' : '');

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        const activeOpt = options.find(o => o.id === initialValue);
        trigger.textContent = activeOpt ? activeOpt.label : initialValue;

        const dropdown = document.createElement('div');
        dropdown.className = 'custom-select-dropdown';

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'custom-select-item';
            if (opt.id === initialValue) item.classList.add('selected');
            item.textContent = opt.label;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                container.classList.remove('open');
                onChange(opt.id);
                renderSingleSelect(container, options, opt.id, onChange);
            });
            dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = container.classList.contains('open');
            document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
            if (!isOpen) container.classList.add('open');
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);
    }

    function renderSearchBox(container, initialValue, onInput) {
        if (!container) return;
        container.innerHTML = '';
        const searchWrap = document.createElement('div');
        searchWrap.className = 'search-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'custom-input';
        input.placeholder = 'Search projects...';
        input.value = initialValue;

        input.addEventListener('input', (e) => {
            onInput(e.target.value);
        });

        searchWrap.appendChild(input);
        container.appendChild(searchWrap);
    }

    function initControlSkeletons() {
        if (searchContainer) searchContainer.innerHTML = '<div class="control-skeleton"></div>';
        if (sortSelectContainer) sortSelectContainer.innerHTML = '<div class="control-skeleton"></div>';
        if (orderSelectContainer) orderSelectContainer.innerHTML = '<div class="control-skeleton"></div>';
        if (typeSelectContainer) typeSelectContainer.innerHTML = '<div class="control-skeleton" style="width: 140px;"></div>';
        if (toolSelectContainer) toolSelectContainer.innerHTML = '<div class="control-skeleton" style="width: 140px;"></div>';
    }

    initControlSkeletons();

    function renderStaticControls() {
        renderSearchBox(searchContainer, searchQuery, (val) => {
            searchQuery = val;
            if (isSkillsPage) filterSkills();
            else filterCards();
        });

        const sortOptions = isSkillsPage
            ? [{ id: 'name', label: 'Name' }, { id: 'proficiency', label: 'Proficiency' }, { id: 'lastUsed', label: 'Last Used' }]
            : [{ id: 'date', label: 'Date' }, { id: 'name', label: 'Name' }];

        renderSingleSelect(sortSelectContainer, sortOptions, selectedSort, (val) => {
            selectedSort = val;
            if (isSkillsPage) sortSkills();
            else sortCards();
        });

        const orderOptions = [{ id: 'desc', label: 'Descending' }, { id: 'asc', label: 'Ascending' }];
        renderSingleSelect(orderSelectContainer, orderOptions, selectedOrder, (val) => {
            selectedOrder = val;
            if (isSkillsPage) sortSkills();
            else sortCards();
        });
    }

    renderStaticControls();

    function filterCards() {
        if (!portfolioGrid) return;
        const query = searchQuery.toLowerCase();
        let visibleCount = 0;
        portfolioGrid.querySelectorAll('.portfolio-card').forEach(card => {
            const cardType = card.getAttribute('data-type') || '';
            const cardTools = (card.getAttribute('data-tools') || '').toLowerCase();
            const toolsList = cardTools.split(',').map(t => t.trim());

            const matchesType = selectedCategories.includes('all') || selectedCategories.includes(cardType);
            const matchesTool = selectedTools.includes('all') || toolsList.some(t => selectedTools.map(st => st.toLowerCase()).includes(t));

            const content = card.innerText.toLowerCase() +
                cardTools +
                (card.getAttribute('data-info') || '').toLowerCase();
            const matchesQuery = content.includes(query);

            if (matchesType && matchesTool && matchesQuery) {
                card.style.display = "block";
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });
        if (noResults) noResults.style.display = visibleCount === 0 ? "block" : "none";
    }

    function filterSkills() {
        if (!skillsList) return;
        const query = searchQuery.toLowerCase();
        let visibleCount = 0;
        skillsList.querySelectorAll('.skill-item').forEach(item => {
            const text = (item.innerText || '').toLowerCase();
            const matchesQuery = query === '' || text.includes(query);
            const matchesType = selectedCategories.includes('all') || selectedCategories.includes(item.dataset.type);
            if (matchesQuery && matchesType) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    function sortSkills() {
        if (!skillsList) return;
        const sortBy = selectedSort;
        const order = selectedOrder;
        const items = Array.from(skillsList.querySelectorAll('.skill-item'));
        items.sort((a, b) => {
            let valA, valB;
            const nameA = a.dataset.name.toLowerCase().trim();
            const nameB = b.dataset.name.toLowerCase().trim();
            if (sortBy === 'name') {
                valA = nameA; valB = nameB;
            } else if (sortBy === 'proficiency') {
                valA = getProficiencyValue(a.querySelector('.level').innerText);
                valB = getProficiencyValue(b.querySelector('.level').innerText);
            } else {
                valA = new Date(a.querySelector('.last-used').innerText).getTime() || 0;
                valB = new Date(b.querySelector('.last-used').innerText).getTime() || 0;
            }
            if (valA === valB) return nameA.localeCompare(nameB);
            return order === 'desc' ? (valA > valB ? -1 : 1) : (valA < valB ? -1 : 1);
        });
        items.forEach(item => skillsList.appendChild(item));
    }

    function sortCards() {
        if (!portfolioGrid) return;
        const sortBy = selectedSort;
        const order = selectedOrder;
        const cards = Array.from(portfolioGrid.querySelectorAll('.portfolio-card'));
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
        cards.forEach(card => portfolioGrid.appendChild(card));
    }


    function initGalleryDrag(slider) {
        if (slider.hasAttribute('data-drag-init')) return;
        slider.setAttribute('data-drag-init', 'true');

        let isDown = false;
        let startX;
        let scrollLeft;
        let hasDragged = false;

        const checkCursor = () => {
            slider.style.cursor = slider.scrollWidth > slider.clientWidth ? 'grab' : 'default';
        };

        const handleMouseDown = (e) => {
            if (slider.scrollWidth <= slider.clientWidth) return;
            isDown = true;
            hasDragged = false;
            startX = (e.clientX || e.pageX) - slider.getBoundingClientRect().left;
            scrollLeft = slider.scrollLeft;
            slider.style.cursor = 'grabbing';
            slider.style.userSelect = 'none';
        };

        const handleMouseMove = (e) => {
            if (!isDown) return;
            const x = (e.clientX || e.pageX) - slider.getBoundingClientRect().left;
            const walk = (x - startX) * 2;
            if (Math.abs(walk) > 5) {
                if (!hasDragged) {
                    hasDragged = true;
                    slider.querySelectorAll('img, .video-thumb-btn').forEach(item => item.style.pointerEvents = 'none');
                }
                slider.scrollLeft = scrollLeft - walk;
            }
        };

        const stopDragging = (e) => {
            if (!isDown) return;
            isDown = false;
            checkCursor();
            slider.style.userSelect = '';
            slider.querySelectorAll('img, .video-thumb-btn, .gallery-skeleton').forEach(item => item.style.pointerEvents = 'auto');

            if (hasDragged) {
                const items = Array.from(slider.querySelectorAll('img, .video-thumb-btn'));
                if (items.length > 0) {
                    const sliderRect = slider.getBoundingClientRect();
                    const sliderCenter = sliderRect.left + (sliderRect.width / 2);

                    let closestItem = null;
                    let minDistance = Infinity;

                    items.forEach(item => {
                        const itemRect = item.getBoundingClientRect();
                        const itemCenter = itemRect.left + (itemRect.width / 2);
                        const distance = Math.abs(sliderCenter - itemCenter);

                        if (distance < minDistance) {
                            minDistance = distance;
                            closestItem = item;
                        }
                    });

                    if (closestItem) {
                        if (!closestItem.classList.contains('selected')) {
                            closestItem.click();
                        } else {
                            centerItemInGallery(slider, closestItem);
                        }
                    }
                }
            }
        };

        slider.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopDragging);
        slider.addEventListener('mouseleave', () => { if (isDown) stopDragging(); });
        slider.addEventListener('dragstart', (e) => e.preventDefault());

        checkCursor();
        setTimeout(checkCursor, 100);
    }

    function centerItemInGallery(container, item) {
        const cRect = container.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        const target = (iRect.left - cRect.left) + container.scrollLeft + (iRect.width / 2) - (container.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth)), behavior: 'smooth' });
    }

    function showVideo(id) {
        const ex = document.getElementById("big-image-view"); if (ex) ex.remove();
        if (videoFrame) {
            videoFrame.style.display = "block";
            videoFrame.src = `https://www.youtube.com/embed/${id}`;
        }
    }

    function showImage(src) {
        if (videoFrame) { videoFrame.style.display = "none"; videoFrame.src = ""; }
        const ex = document.getElementById("big-image-view"); if (ex) ex.remove();
        const big = document.createElement('img');
        big.id = "big-image-view";
        big.src = src;
        if (mediaContainer) mediaContainer.appendChild(big);
    }

    if (closeBtn) closeBtn.onclick = resetModal;

    window.onclick = function (event) {
        if (event.target === modal) {
            resetModal();
        } else if (event.target === secModal) {
            resetSecModal();
        }
    };
});