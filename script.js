document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("infoModal");
    const closeBtn = document.querySelector(".close-button");
    const videoFrame = document.getElementById("modal-video");
    const mediaContainer = document.getElementById("media-container");
    const sortSelect = document.getElementById("sort-select");
    const orderSelect = document.getElementById("order-select");
    const searchInput = document.getElementById("portfolio-search");
    const noResults = document.getElementById("no-results");
    const grid = document.getElementById("portfolio-grid");

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

    if (searchInput) searchInput.addEventListener('input', filterCards);

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

    if (sortSelect) sortSelect.addEventListener('change', sortCards);
    if (orderSelect) orderSelect.addEventListener('change', sortCards);

    document.querySelectorAll('.skill-item').forEach(skill => {
        skill.addEventListener('click', () => {
            const title = skill.querySelector('span:nth-child(2)').innerText;
            const description = skill.getAttribute('data-info');

            document.getElementById("modal-title-main").innerText = title;
            document.getElementById("bio-description").innerText = description;
            modal.style.display = "flex";
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
            slider.style.scrollSnapType = 'x mandatory';
            // Re-enable pointer events on gallery items
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
            setTimeout(() => { slider.style.scrollSnapType = 'x mandatory'; }, 50); 
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
                gallery.innerHTML = "";
                if (youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE") {
                    const videoBtn = document.createElement('div');
                    videoBtn.className = "video-thumb-btn";
                    videoBtn.innerHTML = "<span>▶ VIDEO</span>";
                    videoBtn.addEventListener('click', () => { if (!preventClick) showVideo(youtubeID); });
                    gallery.appendChild(videoBtn);
                }

                if (galleryData) {
                    galleryData.split(',').forEach(src => {
                        const img = document.createElement('img');
                        img.src = src.trim();
                        img.alt = "NO IMAGE";
                        img.addEventListener('click', () => { if (!preventClick) showImage(img.src); });
                        gallery.appendChild(img);
                    });
                }
                initGalleryDrag(gallery);
            }
            modal.style.display = "flex";
        });
    });

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
});