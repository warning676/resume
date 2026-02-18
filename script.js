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

    let currentItemCard = null;
    let currentGalleryIndex = 0;
    let isSkillsPage = !!skillsList;
    let isAchievementsPage = !!achievementsList;
    let isPortfolioPage = !!portfolioGrid;

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

    function openModalForItem(card) {
        currentItemCard = card;
        currentGalleryIndex = 0;

        const modalBody = document.querySelector(".modal-body-split");
        const modalContent = document.querySelector(".modal-content");
        if (modalBody) modalBody.scrollTop = 0;
        if (modalContent) modalContent.scrollTop = 0;

        const container = isSkillsPage ? skillsList : portfolioGrid;
        const itemSelector = isSkillsPage ? '.skill-item' : '.portfolio-card';

        const visibleItems = Array.from(container.querySelectorAll(itemSelector))
            .filter(item => item.style.display !== 'none');

        if (prevBtn) prevBtn.style.visibility = visibleItems.length > 1 ? 'visible' : 'hidden';
        if (nextBtn) nextBtn.style.visibility = visibleItems.length > 1 ? 'visible' : 'hidden';

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

        if (isSkillsPage) {
            const titleMain = document.getElementById('modal-title-main');
            if (titleMain) {
                titleMain.innerText = card.dataset.name.toUpperCase().trim();
            }

            const bioDesc = document.getElementById('bio-description');
            if (bioDesc) bioDesc.innerText = card.dataset.info || "No description available.";

            const modalIcon = document.getElementById('modal-skill-icon');
            if (modalIcon) {
                modalIcon.src = card.querySelector('img').src;
                modalIcon.alt = card.dataset.name;
            }

            const sType = document.getElementById('modal-skill-type');
            if (sType) sType.innerText = card.querySelector('.type-badge').innerText;

            const sLevel = document.getElementById('modal-skill-level');
            if (sLevel) sLevel.innerText = card.querySelector('.level').innerText;

            const sLast = document.getElementById('modal-skill-last');
            if (sLast) sLast.innerText = card.querySelector('.last-used').innerText;

            const certContainer = document.getElementById('modal-skill-cert-container');
            const certName = document.getElementById('modal-skill-cert-name');
            if (certContainer && certName) {
                const isCertified = card.dataset.certified === "true";
                if (isCertified && card.dataset.certName) {
                    certContainer.style.display = "block";
                    certName.innerText = card.dataset.certName;
                } else {
                    certContainer.style.display = "none";
                    certName.innerText = "-";
                }
            }

            if (videoFrame) videoFrame.style.display = 'none';
            const bigImg = document.getElementById("big-image-view");
            if (bigImg) bigImg.remove();
        } else {
            const youtubeID = card.getAttribute('data-youtube');
            const galleryData = card.getAttribute('data-gallery');
            const rawDate = card.getAttribute('data-date');
            const tools = card.getAttribute('data-tools');
            const info = card.getAttribute('data-info');

            const modalTitle = document.getElementById("modal-title");
            if (modalTitle) modalTitle.innerText = card.querySelector('h4').innerText.toUpperCase();

            const modalTools = document.getElementById("modal-tools");
            if (modalTools) modalTools.innerText = "TOOLS: " + (tools ? tools.toUpperCase() : "NONE");

            const modalDesc = document.getElementById("modal-description");
            if (modalDesc) modalDesc.innerText = info;

            const modalDate = document.getElementById("modal-date");
            if (modalDate) modalDate.innerText = formatFullDate(rawDate).toUpperCase();

            const hasVideo = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";
            const images = galleryData ? galleryData.split(',').map(s => s.trim()).filter(s => s !== "") : [];

            if (hasVideo) showVideo(youtubeID);
            else if (images.length > 0) showImage(images[0]);

            if (gallery) {
                const galleryWrapper = document.createElement('div');
                galleryWrapper.className = 'gallery-container-wrapper';
                gallery.parentNode.insertBefore(galleryWrapper, gallery);

                const gPrev = document.createElement('button');
                gPrev.className = 'gallery-nav-btn prev';
                gPrev.innerHTML = '&#10094;';

                const gNext = document.createElement('button');
                gNext.className = 'gallery-nav-btn next';
                gNext.innerHTML = '&#10095;';

                galleryWrapper.appendChild(gPrev);
                galleryWrapper.appendChild(gallery);
                galleryWrapper.appendChild(gNext);

                const updateSelection = (index) => {
                    const items = gallery.querySelectorAll('img, .video-thumb-btn');
                    items.forEach((el, i) => {
                        if (i === index) el.classList.add('selected');
                        else el.classList.remove('selected');
                    });
                };

                if (hasVideo) {
                    const vBtn = document.createElement('div');
                    vBtn.className = "video-thumb-btn selected";
                    vBtn.innerHTML = "<span>▶ VIDEO</span>";
                    vBtn.addEventListener('click', () => {
                        currentGalleryIndex = 0;
                        updateSelection(0);
                        centerItemInGallery(gallery, vBtn);
                        showVideo(youtubeID);
                        updateGalleryButtons(gallery, gPrev, gNext);
                    });
                    gallery.appendChild(vBtn);
                }

                images.forEach((src, idx) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.setAttribute('draggable', 'false');
                    const myIndex = hasVideo ? idx + 1 : idx;
                    if (!hasVideo && idx === 0) img.classList.add('selected');

                    img.addEventListener('click', () => {
                        currentGalleryIndex = myIndex;
                        updateSelection(myIndex);
                        centerItemInGallery(gallery, img);
                        showImage(src);
                        updateGalleryButtons(gallery, gPrev, gNext);
                    });
                    gallery.appendChild(img);
                });

                initGalleryDrag(gallery);

                if (gallery.children.length > 1) {
                    gPrev.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigateGallery(gallery, -1, gPrev, gNext);
                    });
                    gNext.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigateGallery(gallery, 1, gPrev, gNext);
                    });
                    updateGalleryButtons(gallery, gPrev, gNext);
                } else {
                    gPrev.style.display = 'none';
                    gNext.style.display = 'none';
                }
            }
        }
        if (modal) modal.style.display = "flex";
    }

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
        if (modal && modal.style.display === 'flex') {
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
                    <div class="skeleton-element" style="width: 32px; height: 32px; border-radius: 4px; background: #1f2428;"></div>
                    <div class="skill-meta">
                        <div class="skeleton-element" style="width: 120px; height: 14px; margin-bottom: 6px; border-radius: 4px; background: #1f2428;"></div>
                        <div class="skeleton-element" style="width: 70px; height: 10px; border-radius: 4px; background: #1f2428;"></div>
                    </div>
                    <div class="skeleton-element" style="width: 90px; height: 14px; border-radius: 4px; background: #1f2428;"></div>
                    <div class="skeleton-element" style="width: 70px; height: 14px; border-radius: 4px; background: #1f2428;"></div>
                </div>`;
        } else if (isPortfolioGrid) {
            skeletonContent = `
                <div class="portfolio-card skeleton-item">
                    <div class="card-thumb"><div class="skeleton-element" style="width: 100%; height: 100%; background: #1f2428;"></div></div>
                    <div class="card-content">
                        <div class="skeleton-element" style="width: 80%; height: 18px; margin-bottom: 10px; border-radius: 4px; background: #1f2428;"></div>
                        <div class="skeleton-element" style="width: 40%; height: 14px; border-radius: 4px; background: #1f2428;"></div>
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
        .then(response => response.json())
        .then(data => {
            const dateElement = document.getElementById("last-updated-date");
            if (dateElement && data.lastUpdated) dateElement.innerText = data.lastUpdated;

            if (portfolioGrid) {
                const pageType = window.location.pathname.includes('videos.html') ? 'videos' : 'games';
                const projectData = data[pageType] || [];
                showSkeletons(portfolioGrid, projectData.length);
                setTimeout(() => {
                    renderProjects(projectData);
                    checkURLParams();
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
            const card = document.createElement('div');
            card.className = 'portfolio-card';
            card.setAttribute('data-name', project.name);
            card.setAttribute('data-date', project.date);
            card.setAttribute('data-info', project.info);
            card.setAttribute('data-tools', project.tools);
            card.setAttribute('data-youtube', project.youtube || '');
            card.setAttribute('data-gallery', project.gallery ? project.gallery.join(', ') : '');
            const thumbSrc = project.gallery?.[0] || '';
            const displayDate = formatFullDate(project.date);
            card.innerHTML = `
                <div class="card-thumb"><img src="${thumbSrc}" alt="${project.name}"></div>
                <div class="card-content">
                    <h4>${project.name}</h4>
                    <p>${displayDate}</p>
                </div>`;
            card.addEventListener('click', () => openModalForItem(card));
            portfolioGrid.appendChild(card);
        });
        sortCards();
    }

    function renderSkills(skills) {
        if (!skillsList || !skills) return;
        const isAchievementsPage = window.location.pathname.includes('achievements.html');

        skillsList.innerHTML = '<div class="grid-structure grid-header"><span>Skill</span><span>Proficiency</span><span>Last Used</span></div>';

        skills.forEach(skill => {
            if (isAchievementsPage && !skill.certified) return;

            const item = document.createElement('div');
            item.className = 'grid-structure skill-item';
            item.setAttribute('data-type', skill.type || '');
            item.setAttribute('data-name', skill.name);
            item.setAttribute('data-info', skill.info || '');
            item.setAttribute('data-certified', skill.certified ? "true" : "false");
            item.setAttribute('data-cert-name', skill.certName || "");

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

        if (!isAchievementsPage) sortSkills();
    }

    function filterCards() {
        if (!portfolioGrid) return;
        const query = (searchInput?.value || '').toLowerCase();
        let visibleCount = 0;
        portfolioGrid.querySelectorAll('.portfolio-card').forEach(card => {
            const content = card.innerText.toLowerCase() +
                (card.getAttribute('data-tools') || '').toLowerCase() +
                (card.getAttribute('data-info') || '').toLowerCase();
            if (content.includes(query)) {
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
        const query = (searchInput?.value || '').toLowerCase();
        const type = (typeSelect?.value || 'all');
        let visibleCount = 0;
        skillsList.querySelectorAll('.skill-item').forEach(item => {
            const text = (item.innerText || '').toLowerCase();
            const matchesQuery = query === '' || text.includes(query);
            const matchesType = type === 'all' || item.dataset.type === type;
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
        if (!skillsList || !sortSelect) return;
        const sortBy = sortSelect.value;
        const order = orderSelect.value;
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
        if (!portfolioGrid || !sortSelect) return;
        const sortBy = sortSelect?.value || 'date';
        const order = orderSelect?.value || 'desc';
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

    if (searchInput) {
        searchInput.addEventListener('input', isSkillsPage ? filterSkills : filterCards);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', isSkillsPage ? sortSkills : sortCards);
    }
    if (orderSelect) {
        orderSelect.addEventListener('change', isSkillsPage ? sortSkills : sortCards);
    }
    if (typeSelect && skillsList) {
        typeSelect.addEventListener('change', filterSkills);
    }

    let isDown = false, startX, scrollLeft, preventClick = false, hasDragged = false;
    function initGalleryDrag(slider) {
        const checkCursor = () => {
            slider.style.cursor = slider.scrollWidth > slider.clientWidth ? 'grab' : 'default';
        };

        const handleMouseDown = (e) => {
            if (slider.scrollWidth <= slider.clientWidth) return;
            isDown = true;
            preventClick = false;
            hasDragged = false;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            slider.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e) => {
            if (!isDown) return;
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            if (Math.abs(walk) > 5) {
                e.preventDefault();
                if (!hasDragged) {
                    hasDragged = true;
                    preventClick = true;
                    slider.querySelectorAll('img, .video-thumb-btn').forEach(item => item.style.pointerEvents = 'none');
                }
                slider.scrollLeft = scrollLeft - walk;
            }
        };

        const stopDragging = () => {
            isDown = false;
            checkCursor();
            slider.querySelectorAll('img, .video-thumb-btn').forEach(item => item.style.pointerEvents = 'auto');
        };

        slider.addEventListener('mousedown', handleMouseDown);
        slider.addEventListener('mousemove', handleMouseMove);
        slider.addEventListener('mouseleave', stopDragging);
        slider.addEventListener('mouseup', stopDragging);

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

    const resetModal = () => {
        if (modal) modal.style.display = "none";
        if (videoFrame) videoFrame.src = "";
        const ex = document.getElementById("big-image-view"); if (ex) ex.remove();
        if (document.querySelector(".modal-body-split")) document.querySelector(".modal-body-split").scrollTop = 0;
        if (document.querySelector(".modal-content")) document.querySelector(".modal-content").scrollTop = 0;
        const gal = document.getElementById("modal-gallery"); if (gal) gal.scrollLeft = 0;
        currentItemCard = null;
    };

    if (closeBtn) closeBtn.onclick = resetModal;

    window.onclick = function (event) {
        if (event.target === modal) {
            resetModal();
        }
    };
});