document.addEventListener('DOMContentLoaded', () => {
    includeHTML();
    const modal = document.getElementById("infoModal");
    const closeBtn = document.querySelector(".close-button");
    const videoFrame = document.getElementById("modal-video");
    const mediaContainer = document.getElementById("media-container");
    const sortSelect = document.getElementById("sort-select");
    const orderSelect = document.getElementById("order-select");
    const searchInput = document.getElementById("portfolio-search");
    const typeSelect = document.getElementById('type-select');
    const skillsList = document.getElementById('skills-list');
    const noResults = document.getElementById("no-results");
    const grid = document.getElementById("portfolio-grid");
    const modalBody = document.querySelector(".modal-body-split");

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

    document.addEventListener('DOMContentLoaded', includeHTML);

    function formatFullDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString.replace(/-/g, '\/'));
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    const showSkeletons = (container, count, className) => {
        if (!container) return;
        const isAchievementsPage = window.location.pathname.includes('achievements.html');
        const isTechnicalPage = window.location.pathname.includes('technical.html');
        const isPortfolioGrid = container.id === 'portfolio-grid';

        container.style.visibility = 'visible';
        container.style.display = isPortfolioGrid ? 'grid' : 'block';

        let headerHTML = '';
        if (isAchievementsPage) {
            headerHTML = '<div class="grid-structure grid-header"><span>Software</span><span>Certification Status</span><span>Last Used</span></div>';
        } else if (isTechnicalPage) {
            headerHTML = '<div class="grid-structure grid-header"><span>Skill</span><span>Proficiency</span><span>Last Used</span></div>';
        }
        container.innerHTML = headerHTML;

        let skeletonContent = '';
        if (isAchievementsPage || isTechnicalPage) {
            skeletonContent = `
                <div class="grid-structure skill-item skeleton-item">
                    <div class="skeleton-element" style="width: 32px; height: 32px; border-radius: 4px; background: #1f2428;"></div>
                    <div class="skill-meta">
                        <div class="skeleton-element" style="width: 120px; height: 14px; margin-bottom: 6px; border-radius: 4px; background: #1f2428;"></div>
                        <div class="skeleton-element" style="width: 70px; height: 10px; border-radius: 4px; background: #1f2428;"></div>
                    </div>
                    <div class="skeleton-element" style="width: 90px; height: 14px; border-radius: 4px; background: #1f2428;"></div>
                    <div class="skeleton-element" style="width: 70px; height: 14px; border-radius: 4px; background: #1f2428;"></div>
                </div>
            `;
        } else if (isPortfolioGrid) {
            skeletonContent = `
                <div class="portfolio-card skeleton-item">
                    <div class="card-thumb"><div class="skeleton-element" style="width: 100%; height: 100%; background: #1f2428;"></div></div>
                    <div class="card-content">
                        <div class="skeleton-element" style="width: 80%; height: 18px; margin-bottom: 10px; border-radius: 4px; background: #1f2428;"></div>
                        <div class="skeleton-element" style="width: 40%; height: 14px; border-radius: 4px; background: #1f2428;"></div>
                    </div>
                </div>
            `;
        }
        for (let i = 0; i < count; i++) {
            container.insertAdjacentHTML('beforeend', skeletonContent);
        }
    };

    function getProficiencyValue(level) {
        const scores = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
        return scores[level] || 0;
    }

    fetch('projects.json')
        .then(response => response.json())
        .then(data => {
            if (grid) {
                const pageType = window.location.pathname.includes('videos.html') ? 'videos' : 'games';
                const projectData = data[pageType] || [];
                showSkeletons(grid, projectData.length, 'skeleton-card');
                setTimeout(() => renderProjects(projectData), 300);
            }
            if (skillsList) {
                const isAchievements = window.location.pathname.includes('achievements.html');
                const skillData = data.skills || [];
                const dynamicCount = isAchievements ? skillData.filter(s => s.certified === true).length : skillData.length;
                showSkeletons(skillsList, dynamicCount, 'skeleton-skill');
                setTimeout(() => renderSkills(skillData), 400);
            }
        })
        .catch(err => console.error("Error loading data:", err));

    fetch('projects.json')
        .then(response => response.json())
        .then(data => {
            const dateElement = document.getElementById("last-updated-date");
            if (dateElement && data.lastUpdated) {
                dateElement.innerText = data.lastUpdated;
            }

            if (grid) {
                const pageType = window.location.pathname.includes('videos.html') ? 'videos' : 'games';
                const projectData = data[pageType] || [];
                showSkeletons(grid, projectData.length, 'skeleton-card');
                setTimeout(() => renderProjects(projectData), 300);
            }
            if (skillsList) {
                const isAchievements = window.location.pathname.includes('achievements.html');
                const skillData = data.skills || [];
                const dynamicCount = isAchievements ? skillData.filter(s => s.certified === true).length : skillData.length;
                showSkeletons(skillsList, dynamicCount, 'skeleton-skill');
                setTimeout(() => renderSkills(skillData), 400);
            }
        })
        .catch(err => console.error("Error loading data:", err));

    function renderProjects(projects) {
        if (!grid || !projects) return;
        grid.innerHTML = '';
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'portfolio-card';
            card.setAttribute('data-name', project.name);
            card.setAttribute('data-date', project.date);
            card.setAttribute('data-info', project.info);
            card.setAttribute('data-tools', project.tools);
            card.setAttribute('data-youtube', project.youtube);
            card.setAttribute('data-gallery', project.gallery.join(', '));
            const thumbSrc = project.gallery.length > 0 ? project.gallery[0] : '';
            const displayDate = formatFullDate(project.date);
            card.innerHTML = `
                <div class="card-thumb"><img src="${thumbSrc}" alt="${project.name}"></div>
                <div class="card-content">
                    <h4>${project.name}</h4>
                    <p>${displayDate}</p>
                </div>`;
            card.addEventListener('click', () => openProjectModal(card));
            grid.appendChild(card);
        });
        sortCards();
    }

    function renderSkills(skills) {
        if (!skillsList || !skills) return;
        const isAchievementsPage = window.location.pathname.includes('achievements.html');
        const headerNode = skillsList.querySelector('.grid-header');
        let headerHTML = headerNode ? headerNode.outerHTML : '<div class="grid-structure grid-header"><span>Skill</span><span>Proficiency</span><span>Last Used</span></div>';
        if (isAchievementsPage) {
            headerHTML = '<div class="grid-structure grid-header"><span>Software</span><span>Certification Status</span><span>Last Used</span></div>';
        }
        skillsList.innerHTML = headerHTML;
        skills.forEach(skill => {
            if (isAchievementsPage && !skill.certified) return;
            const item = document.createElement('div');
            item.className = 'grid-structure skill-item';
            item.setAttribute('data-type', skill.type);
            item.setAttribute('data-name', skill.name);
            const listLevelDisplay = isAchievementsPage ? 'Certified Professional' : skill.level;
            item.innerHTML = `
            <img src="${skill.icon}" class="skill-icon">
            <span class="skill-meta">
                <span class="skill-name">${skill.name}</span>
                <span class="type-badge">${skill.badge}</span>
            </span>
            <span class="level">${listLevelDisplay}</span>
            <span class="last-used">${skill.lastUsed}</span>`;
            item.addEventListener('click', () => {
                const titleMain = document.getElementById('modal-title-main');
                const titleAlt = document.getElementById('modal-title');
                if (titleMain) titleMain.innerText = skill.name.toUpperCase();
                else if (titleAlt) titleAlt.innerText = skill.name.toUpperCase();

                const bioDesc = document.getElementById('bio-description');
                const modDesc = document.getElementById('modal-description');
                if (bioDesc) bioDesc.innerText = skill.info;
                else if (modDesc) modDesc.innerText = skill.info;

                const modalIcon = document.getElementById('modal-skill-icon');
                if (modalIcon) { modalIcon.src = skill.icon; modalIcon.alt = skill.name; }

                const sType = document.getElementById('modal-skill-type');
                if (sType) sType.innerText = skill.badge;

                const sLevel = document.getElementById('modal-skill-level');
                if (sLevel) sLevel.innerText = skill.level;

                const sLast = document.getElementById('modal-skill-last');
                if (sLast) sLast.innerText = skill.lastUsed;

                const certContainer = document.getElementById('modal-skill-cert-container');
                const certNameDisplay = document.getElementById('modal-skill-cert-name');
                if (certContainer) {
                    if (skill.certified && skill.certName) {
                        certContainer.style.display = 'block';
                        if (certNameDisplay) certNameDisplay.innerText = skill.certName;
                    } else {
                        certContainer.style.display = 'none';
                    }
                }

                if (modalBody) modalBody.scrollTop = 0;
                const modalContent = document.querySelector(".modal-content");
                if (modalContent) modalContent.scrollTop = 0;
                if (modal) modal.style.display = 'flex';
            });
            skillsList.appendChild(item);
        });
        if (!isAchievementsPage) sortSkills();
    }

    function filterCards() {
        if (!grid) return;
        const query = searchInput.value.toLowerCase();
        let visibleCount = 0;
        grid.querySelectorAll('.portfolio-card').forEach(card => {
            const content = card.innerText.toLowerCase() + card.getAttribute('data-tools').toLowerCase() + card.getAttribute('data-info').toLowerCase();
            if (content.includes(query)) { card.style.display = "block"; visibleCount++; }
            else { card.style.display = "none"; }
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
            if (matchesQuery && matchesType) { item.style.display = ''; visibleCount++; }
            else { item.style.display = 'none'; }
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
            const nameA = a.querySelector('.skill-name').innerText.toLowerCase();
            const nameB = b.querySelector('.skill-name').innerText.toLowerCase();
            if (sortBy === 'name') { valA = nameA; valB = nameB; }
            else if (sortBy === 'proficiency') {
                valA = getProficiencyValue(a.querySelector('.level').innerText);
                valB = getProficiencyValue(b.querySelector('.level').innerText);
            } else {
                valA = new Date(a.querySelector('.last-used').innerText).getTime();
                valB = new Date(b.querySelector('.last-used').innerText).getTime();
            }
            if (valA === valB) return nameA.localeCompare(nameB);
            return order === 'desc' ? (valA > valB ? -1 : 1) : (valA < valB ? -1 : 1);
        });
        items.forEach(item => skillsList.appendChild(item));
    }

    function sortCards() {
        if (!grid) return;
        const sortBy = sortSelect?.value || 'date';
        const order = orderSelect?.value || 'desc';
        const cards = Array.from(grid.querySelectorAll('.portfolio-card'));
        cards.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'name') { valA = a.getAttribute('data-name').toLowerCase(); valB = b.getAttribute('data-name').toLowerCase(); }
            else { valA = new Date(a.getAttribute('data-date').replace(/-/g, '\/')).getTime(); valB = new Date(b.getAttribute('data-date').replace(/-/g, '\/')).getTime(); }
            return order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
        cards.forEach(card => grid.appendChild(card));
    }

    if (searchInput) {
        if (grid) searchInput.addEventListener('input', filterCards);
        else if (skillsList) searchInput.addEventListener('input', filterSkills);
    }
    if (sortSelect) {
        if (grid) sortSelect.addEventListener('change', sortCards);
        else if (skillsList) sortSelect.addEventListener('change', sortSkills);
    }
    if (orderSelect) {
        if (grid) orderSelect.addEventListener('change', sortCards);
        else if (skillsList) orderSelect.addEventListener('change', sortSkills);
    }
    if (typeSelect && skillsList) typeSelect.addEventListener('change', filterSkills);

    let isDown = false, startX, scrollLeft, preventClick = false, hasDragged = false;
    function initGalleryDrag(slider) {
        const checkCursor = () => {
            slider.style.cursor = slider.scrollWidth > slider.clientWidth ? 'grab' : 'default';
        };

        const handleMouseDown = (e) => {
            // Only initiate drag logic if the gallery is actually scrollable
            if (slider.scrollWidth <= slider.clientWidth) {
                isDown = false;
                preventClick = false;
                return;
            }

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

    function openProjectModal(card) {
        if (modalBody) modalBody.scrollTop = 0;
        const modalContent = document.querySelector(".modal-content");
        if (modalContent) modalContent.scrollTop = 0;

        let gallery = document.getElementById("modal-gallery");
        if (gallery) {
            const newGallery = gallery.cloneNode(false);
            gallery.parentNode.replaceChild(newGallery, gallery);
            gallery = newGallery;
            gallery.scrollLeft = 0;
        }

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
        else { const ex = document.getElementById("big-image-view"); if (ex) ex.remove(); }

        if (gallery) {
            preventClick = false;

            if (hasVideo) {
                const vBtn = document.createElement('div');
                vBtn.className = "video-thumb-btn"; vBtn.innerHTML = "<span>▶ VIDEO</span>";
                vBtn.addEventListener('click', (e) => {
                    if (!preventClick) { centerItemInGallery(gallery, vBtn); showVideo(youtubeID); }
                });
                gallery.appendChild(vBtn);
            }

            images.forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.setAttribute('draggable', 'false');
                img.addEventListener('click', (e) => {
                    if (!preventClick) { centerItemInGallery(gallery, img); showImage(src); }
                });
                gallery.appendChild(img);
            });

            initGalleryDrag(gallery);
        }

        const closeBtn = document.querySelector(".close-button");
        if (closeBtn) closeBtn.onclick = resetModal;

        if (modal) {
            modal.style.display = "flex";
            window.onclick = (e) => { if (e.target == modal) resetModal(); };
        }
    }

    function centerItemInGallery(container, item) {
        const cRect = container.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        const target = (iRect.left - cRect.left) + container.scrollLeft + (iRect.width / 2) - (container.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth)), behavior: 'smooth' });
    }

    function showVideo(id) {
        const ex = document.getElementById("big-image-view"); if (ex) ex.remove();
        if (videoFrame) { videoFrame.style.display = "block"; videoFrame.src = `https://www.youtube.com/embed/${id}`; }
    }

    function showImage(src) {
        if (videoFrame) { videoFrame.style.display = "none"; videoFrame.src = ""; }
        const ex = document.getElementById("big-image-view"); if (ex) ex.remove();
        const big = document.createElement('img'); big.id = "big-image-view"; big.src = src;
        if (mediaContainer) mediaContainer.appendChild(big);
    }

    const resetModal = () => {
        if (modal) modal.style.display = "none";
        if (videoFrame) videoFrame.src = "";
        const ex = document.getElementById("big-image-view"); if (ex) ex.remove();
        if (modalBody) modalBody.scrollTop = 0;
        const mc = document.querySelector(".modal-content"); if (mc) mc.scrollTop = 0;
        const gal = document.getElementById("modal-gallery"); if (gal) gal.scrollLeft = 0;
    };

    if (closeBtn) closeBtn.onclick = resetModal;
    window.onclick = (e) => { if (e.target == modal) resetModal(); };
});