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
    const grids = document.querySelectorAll('.portfolio-grid');
    grids.forEach(g => { try { g.style.visibility = 'hidden'; } catch (e) { } });

    function filterCards() {
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

        noResults.style.display = visibleCount === 0 ? "block" : "none";
    }

    if (searchInput) {
        if (grid) searchInput.addEventListener('input', filterCards);
        else if (skillsList) searchInput.addEventListener('input', filterSkills);
    }

    function parseProficiency(text) {
        const t = (text || '').toLowerCase();
        if (t.includes('begin')) return 0;
        if (t.includes('inter')) return 1;
        if (t.includes('adv')) return 2;
        return -1;
    }

    function parseDateText(text) {
        if (!text) return new Date(0);
        const trimmed = text.trim().replace(/\s+/g, ' ');
        const m = trimmed.match(/([A-Za-z]+)\s+(\d{4})/);
        if (m) {
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const mon = m[1].toLowerCase().slice(0, 3);
            const year = parseInt(m[2], 10);
            const mi = monthNames.indexOf(mon);
            if (mi >= 0) return new Date(year, mi, 1);
        }
        const tryDate = new Date(trimmed);
        if (!isNaN(tryDate)) return tryDate;
        const d = new Date('1 ' + trimmed);
        return isNaN(d) ? new Date(0) : d;
    }

    function sortSkills() {
        if (!skillsList) return;
        const sortBy = sortSelect?.value || 'last-used';
        const order = orderSelect?.value || 'desc';
        const items = Array.from(skillsList.querySelectorAll('.skill-item'));

        const compare = (a, b) => {
            let va, vb;
            if (sortBy === 'proficiency') {
                va = parseProficiency(a.querySelector('.level')?.innerText || '');
                vb = parseProficiency(b.querySelector('.level')?.innerText || '');
            } else {
                va = parseDateText(a.querySelector('.last-used')?.innerText || '').getTime();
                vb = parseDateText(b.querySelector('.last-used')?.innerText || '').getTime();
            }
            if (va < vb) return order === 'asc' ? -1 : 1;
            if (va > vb) return order === 'asc' ? 1 : -1;
            return 0;
        };

        items.sort(compare);

        items.forEach(item => skillsList.appendChild(item));

        skillsList.parentElement.style.visibility = 'visible';
    }

    sortSkills();

    if (skillsList) {
        const skillsSection = document.getElementById('skills');
        if (skillsSection) {
            skillsSection.style.display = 'none';
        }
        if (sortSelect) sortSelect.value = sortSelect.value || 'last-used';
        if (orderSelect) orderSelect.value = orderSelect.value || 'desc';
        setTimeout(() => {
            try { sortSkills(); } catch (e) { console.error(e); }
            if (skillsSection) {
                skillsSection.style.display = '';
            }
        }, 60);
        setTimeout(() => {
            try { sortSkills(); } catch (e) { console.error(e); }
        }, 300);
    }

    function sortCards() {
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.portfolio-card'));
        const sortBy = sortSelect.value;
        const order = orderSelect.value;
        cards.sort((a, b) => {
            let valA = a.getAttribute(`data-${sortBy}`).toLowerCase();
            let valB = b.getAttribute(`data-${sortBy}`).toLowerCase();
            if (sortBy === 'date') {
                valA = new Date(valA.replace(/-/g, '\/'));
                valB = new Date(valB.replace(/-/g, '\/'));
            }
            return order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
        cards.forEach(card => grid.appendChild(card));
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

    function filterSkills() {
        if (!skillsList) return;
        const query = (searchInput?.value || '').toLowerCase();
        const type = (typeSelect?.value || 'all');
        const items = Array.from(skillsList.querySelectorAll('.skill-item'));
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
        if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }



    document.querySelectorAll('.skill-item').forEach(skill => {
        skill.addEventListener('click', () => {
            const name = skill.querySelector('.skill-name')?.innerText || '';
            const type = skill.querySelector('.type-badge')?.innerText || '';
            const description = skill.getAttribute('data-info') || '';

            const titleNode = document.getElementById('modal-title-main');
            if (titleNode) titleNode.innerText = `${name.toUpperCase()}${type ? ' - ' + type.toUpperCase() : ''}`;
            const bioNode = document.getElementById('bio-description');
            if (bioNode) bioNode.innerText = description;
            if (modal) modal.style.display = 'flex';
        });
    });

    let isDown = false, startX, scrollLeft, preventClick = false, hasDragged = false;
    function initGalleryDrag(slider) {
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            preventClick = false;
            hasDragged = false;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            slider.style.scrollSnapType = 'none';
            slider.style.cursor = 'grabbing';
        });
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            if (hasDragged) {
                slider.querySelectorAll('img, .video-thumb-btn').forEach(item => {
                    item.style.pointerEvents = 'auto';
                });
            }
        });
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
            if (hasDragged) {
                slider.querySelectorAll('img, .video-thumb-btn').forEach(item => {
                    item.style.pointerEvents = 'auto';
                });
            }
        });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            const x = e.pageX - slider.offsetLeft;
            const distance = Math.abs(x - startX);

            if (distance > 5) {
                if (!hasDragged) {
                    hasDragged = true;
                    preventClick = true;
                    slider.querySelectorAll('img, .video-thumb-btn').forEach(item => {
                        item.style.pointerEvents = 'none';
                    });
                }
                slider.scrollLeft = scrollLeft - (x - startX) * 2;
            }
        });
    }

    document.querySelectorAll('.portfolio-card').forEach(card => {
        card.addEventListener('click', () => {
            const youtubeID = card.getAttribute('data-youtube');
            const galleryData = card.getAttribute('data-gallery');
            const dateStr = card.getAttribute('data-date');

            document.getElementById("modal-title").innerText = card.querySelector('h4').innerText;
            document.getElementById("modal-description").innerText = card.getAttribute('data-info');
            document.getElementById("modal-tools").innerText = "Tools: " + card.getAttribute('data-tools');

            const dateObj = new Date(dateStr.replace(/-/g, '\/'));
            document.getElementById("modal-date").innerText = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            if (youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE") {
                showVideo(youtubeID);
            } else {
                const firstImg = galleryData ? galleryData.split(',')[0].trim() : "";
                showImage(firstImg);
            }

            const gallery = document.getElementById("modal-gallery");
            if (gallery) {
                try { gallery.scrollLeft = 0; } catch (e) { }
                gallery.innerHTML = "";
                if (youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE") {
                    const videoBtn = document.createElement('div');
                    videoBtn.className = "video-thumb-btn";
                    videoBtn.innerHTML = "<span>▶ VIDEO</span>";
                    videoBtn.addEventListener('click', (e) => {
                        if (preventClick) return;
                        centerItemInGallery(gallery, videoBtn);
                        showVideo(youtubeID);
                    });
                    gallery.appendChild(videoBtn);
                }

                if (galleryData) {
                    galleryData.split(',').forEach(src => {
                        const img = document.createElement('img');
                        img.src = src.trim();
                        img.alt = "NO IMAGE";
                        img.addEventListener('click', (e) => {
                            if (preventClick) return;
                            centerItemInGallery(gallery, img);
                            showImage(img.src);
                        });
                        img.onload = () => { try { gallery.scrollLeft = 0; } catch (e) { } };
                        gallery.appendChild(img);
                    });
                }
                initGalleryDrag(gallery);
                try { gallery.scrollLeft = 0; } catch (e) { }
                setTimeout(() => { try { gallery.scrollLeft = 0; } catch (e) { } }, 50);
            }
            modal.style.display = "flex";
        });
    });

    function centerItemInGallery(container, item) {
        if (!container || !item) return;
        const containerRect = container.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const currentScroll = container.scrollLeft;
        const itemOffsetFromContentStart = (itemRect.left - containerRect.left) + currentScroll;
        const targetScroll = Math.round(itemOffsetFromContentStart + (itemRect.width / 2) - (container.clientWidth / 2));
        const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
        const clamped = Math.max(0, Math.min(targetScroll, maxScroll));
        container.scrollTo({ left: clamped, behavior: 'smooth' });
    }

    function showVideo(id) {
        if (document.getElementById("big-image-view")) document.getElementById("big-image-view").remove();
        videoFrame.style.display = "block";
        videoFrame.src = `https://www.youtube.com/embed/${id}`;
    }

    function showImage(src) {
        videoFrame.style.display = "none";
        videoFrame.src = "";
        if (document.getElementById("big-image-view")) document.getElementById("big-image-view").remove();
        if (!src) return;
        const big = document.createElement('img');
        big.id = "big-image-view";
        big.src = src;
        mediaContainer.appendChild(big);
    }

    const resetModal = () => {
        modal.style.display = "none";
        videoFrame.src = "";
        if (document.getElementById("big-image-view")) document.getElementById("big-image-view").remove();
    };

    closeBtn.onclick = resetModal;
    window.onclick = (e) => { if (e.target == modal) resetModal(); };
    sortCards();
    grids.forEach(g => { try { g.style.visibility = 'visible'; } catch (e) { } });
});