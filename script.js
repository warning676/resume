document.addEventListener('DOMContentLoaded', () => {
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

    const showSkeletons = (container, count, className) => {
        if (!container) return;
        container.style.visibility = 'visible';
        container.style.display = 'block';
        const header = container.querySelector('.grid-header');
        container.innerHTML = header ? header.outerHTML : '';
        container.innerHTML += Array(count).fill(`<div class="skeleton ${className}"></div>`).join('');
    };

    if (skillsList) {
        const skillSection = document.getElementById('skills');
        if (skillSection) skillSection.style.visibility = 'visible';
    }

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
                const skillData = data.skills || [];
                showSkeletons(skillsList, skillData.length, 'skeleton-skill');
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

            card.innerHTML = `
                <div class="card-thumb">
                    <img src="${thumbSrc}" alt="${project.name}">
                </div>
                <div class="card-content">
                    <h4>${project.name}</h4>
                    <p>${project.displayDate}</p>
                </div>
            `;
            card.addEventListener('click', () => openProjectModal(card));
            grid.appendChild(card);
        });
        sortCards();
    }

    function renderSkills(skills) {
        if (!skillsList || !skills) return;
        const headerNode = skillsList.querySelector('.grid-header');
        const headerHTML = headerNode ? headerNode.outerHTML : '<div class="grid-structure grid-header"><span>Skill</span><span>Proficiency</span><span>Last Used</span></div>';
        skillsList.innerHTML = headerHTML;

        skills.forEach(skill => {
            const item = document.createElement('div');
            item.className = 'grid-structure skill-item';
            item.setAttribute('data-name', skill.name);
            item.setAttribute('data-type', skill.type);
            item.setAttribute('data-info', skill.info);

            item.innerHTML = `
                <img src="${skill.icon}" class="skill-icon">
                <span class="skill-meta">
                    <span class="skill-name">${skill.name}</span>
                    <span class="type-badge">${skill.badge}</span>
                </span>
                <span class="level">${skill.level}</span>
                <span class="last-used">${skill.lastUsed}</span>
            `;

            item.addEventListener('click', () => {
                const titleNode = document.getElementById('modal-title-main');
                if (titleNode) titleNode.innerText = skill.name.toUpperCase();

                const bioNode = document.getElementById('bio-description');
                if (bioNode) bioNode.innerText = skill.info;

                const modalIcon = document.getElementById('modal-skill-icon');
                if (modalIcon) {
                    modalIcon.src = skill.icon;
                    modalIcon.alt = skill.name;
                }

                const modalType = document.getElementById('modal-skill-type');
                const modalLevel = document.getElementById('modal-skill-level');
                const modalLast = document.getElementById('modal-skill-last');

                if (modalType) modalType.innerText = skill.badge;
                if (modalLevel) modalLevel.innerText = skill.level;
                if (modalLast) modalLast.innerText = skill.lastUsed;

                if (modalBody) modalBody.scrollTop = 0;
                if (modal) modal.style.display = 'flex';
            });
            skillsList.appendChild(item);
        });
        sortSkills();
    }

    function filterCards() {
        if (!grid) return;
        const query = searchInput.value.toLowerCase();
        const cards = grid.querySelectorAll('.portfolio-card');
        let visibleCount = 0;
        cards.forEach(card => {
            const content = card.innerText.toLowerCase() +
                card.getAttribute('data-tools').toLowerCase() +
                card.getAttribute('data-info').toLowerCase();
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
        const items = Array.from(skillsList.querySelectorAll('.skill-item'));
        const header = skillsList.querySelector('.grid-header');

        let visibleCount = 0;

        items.forEach(item => {
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

        if (visibleCount === 0) {
            if (noResults) noResults.style.display = 'block';
            if (header) header.style.display = 'none';
        } else {
            if (noResults) noResults.style.display = 'none';
            if (header) header.style.display = 'grid';
        }
    }

    function sortSkills() {
        const sortBy = document.getElementById('sort-select').value;
        const order = document.getElementById('order-select').value;
        const items = Array.from(skillsList.querySelectorAll('.skill-item'));

        items.sort((a, b) => {
            let valA, valB;
            const nameA = a.querySelector('.skill-name').innerText.toLowerCase();
            const nameB = b.querySelector('.skill-name').innerText.toLowerCase();

            if (sortBy === 'name') {
                valA = nameA;
                valB = nameB;
            } else if (sortBy === 'proficiency') {
                valA = getProficiencyValue(a.querySelector('.level').innerText);
                valB = getProficiencyValue(b.querySelector('.level').innerText);
            } else {
                valA = new Date(a.querySelector('.last-used').innerText);
                valB = new Date(b.querySelector('.last-used').innerText);
            }

            if (valA.toString() === valB.toString()) {
                return nameA.localeCompare(nameB);
            }

            if (order === 'desc') {
                return valA > valB ? -1 : 1;
            } else {
                return valA < valB ? -1 : 1;
            }
        });

        items.forEach(item => skillsList.appendChild(item));
    }

    function sortCards() {
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.portfolio-card'));
        const sortBy = sortSelect?.value || 'date';
        const order = orderSelect?.value || 'desc';
        cards.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'name') {
                valA = a.getAttribute('data-name').toLowerCase();
                valB = b.getAttribute('data-name').toLowerCase();
            } else {
                valA = new Date(a.getAttribute('data-date').replace(/-/g, '\/'));
                valB = new Date(b.getAttribute('data-date').replace(/-/g, '\/'));
            }
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
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            preventClick = false;
            hasDragged = false;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            slider.style.cursor = 'grabbing';
        });

        const stopDragging = () => {
            if (!isDown) return;
            isDown = false;
            slider.style.cursor = 'grab';
            const items = slider.querySelectorAll('img, .video-thumb-btn');
            items.forEach(item => item.style.pointerEvents = 'auto');
        };

        slider.addEventListener('mouseleave', stopDragging);
        slider.addEventListener('mouseup', stopDragging);

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;

            e.preventDefault();
            if (window.getSelection) window.getSelection().removeAllRanges();

            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;

            if (Math.abs(walk) > 5) {
                if (!hasDragged) {
                    hasDragged = true;
                    preventClick = true;
                    const items = slider.querySelectorAll('img, .video-thumb-btn');
                    items.forEach(item => item.style.pointerEvents = 'none');
                }
                slider.scrollLeft = scrollLeft - walk;
            }
        });

        slider.addEventListener('dragstart', (e) => e.preventDefault());
    }

    function openProjectModal(card) {
        if (modalBody) modalBody.scrollTo(0, 0);
        const gallery = document.getElementById("modal-gallery");
        if (gallery) gallery.scrollLeft = 0;

        const modalContent = document.querySelector(".modal-content");
        if (modalContent) modalContent.scrollTo(0, 0);

        const youtubeID = card.getAttribute('data-youtube');
        const galleryData = card.getAttribute('data-gallery');
        const dateStr = card.getAttribute('data-date');
        const tools = card.getAttribute('data-tools');
        const info = card.getAttribute('data-info');

        const modalTitle = document.getElementById("modal-title");
        if (modalTitle) modalTitle.innerText = card.querySelector('h4').innerText.toUpperCase();

        const modalTools = document.getElementById("modal-tools");
        if (modalTools) modalTools.innerText = "TOOLS: " + (tools ? tools.toUpperCase() : "NONE");

        const modalDesc = document.getElementById("modal-description");
        if (modalDesc) modalDesc.innerText = info;

        const modalDate = document.getElementById("modal-date");
        if (modalDate && dateStr) {
            const dateObj = new Date(dateStr.replace(/-/g, '\/'));
            modalDate.innerText = dateObj.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            }).toUpperCase();
        }

        const hasVideo = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";
        const images = galleryData ? galleryData.split(',').map(s => s.trim()).filter(s => s !== "") : [];

        if (hasVideo) {
            showVideo(youtubeID);
        } else if (images.length > 0) {
            showImage(images[0]);
        } else {
            const existingBig = document.getElementById("big-image-view");
            if (existingBig) existingBig.remove();
        }

        if (gallery) {
            gallery.innerHTML = "";
            let itemsAdded = 0;

            if (hasVideo) {
                const videoBtn = document.createElement('div');
                videoBtn.className = "video-thumb-btn";
                videoBtn.innerHTML = "<span>▶ VIDEO</span>";
                videoBtn.addEventListener('click', (e) => {
                    if (preventClick) return;
                    centerItemInGallery(gallery, videoBtn);
                    showVideo(youtubeID);
                });
                gallery.appendChild(videoBtn);
                itemsAdded++;
            }

            images.forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.setAttribute('draggable', 'false');
                img.addEventListener('click', (e) => {
                    if (preventClick) return;
                    centerItemInGallery(gallery, img);
                    showImage(src);
                });
                gallery.appendChild(img);
                itemsAdded++;
            });

            initGalleryDrag(gallery);
        }
        if (modal) modal.style.display = "flex";
    }

    function centerItemInGallery(container, item) {
        const cRect = container.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        const target = (iRect.left - cRect.left) + container.scrollLeft + (iRect.width / 2) - (container.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth)), behavior: 'smooth' });
    }

    function showVideo(id) {
        const existing = document.getElementById("big-image-view");
        if (existing) existing.remove();
        videoFrame.style.display = "block";
        videoFrame.src = `https://www.youtube.com/embed/${id}`;
    }

    function showImage(src) {
        videoFrame.style.display = "none";
        videoFrame.src = "";
        const existing = document.getElementById("big-image-view");
        if (existing) existing.remove();
        if (!src) return;
        const big = document.createElement('img');
        big.id = "big-image-view";
        big.src = src;
        mediaContainer.appendChild(big);
    }

    const resetModal = () => {
        if (modal) modal.style.display = "none";
        videoFrame.src = "";

        const existing = document.getElementById("big-image-view");
        if (existing) existing.remove();

        if (modalBody) modalBody.scrollTop = 0;
        const modalContent = document.querySelector(".modal-content");
        if (modalContent) modalContent.scrollTop = 0;
        const gallery = document.getElementById("modal-gallery");
        if (gallery) gallery.scrollLeft = 0;
    };

    if (closeBtn) closeBtn.onclick = resetModal;
    window.onclick = (e) => { if (e.target == modal) resetModal(); };
});