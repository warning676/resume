class ModalManager {
    constructor(state) {
        this.s = state;
    }

    // Fix relative image paths since HTML is now in html/ subfolder
    fixImagePath(path) {
        if (!path) return path;
        // If it's already absolute (http/https) or data URI, return as-is
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        // For relative paths, prepend ../ if not already present
        if (path.startsWith('../')) return path;
        return '../' + path;
    }

    resetModal() {
        const s = this.s;
        if (s.modal) s.modal.style.display = "none";
        if (s.videoFrame) s.videoFrame.src = "";
        const ex = document.getElementById("big-image-view");
        if (ex) ex.remove();
        const modalBody = document.querySelector(".modal-body-split");
        if (modalBody) modalBody.scrollTop = 0;
        const modalContent = document.querySelector(".modal-content");
        if (modalContent) modalContent.scrollTop = 0;
        const gal = document.getElementById("modal-gallery");
        if (gal) gal.scrollLeft = 0;
        s.currentItemCard = null;
        try { document.body.style.overflow = ''; } catch (e) {}
        try {
            const c = s.modal ? s.modal.querySelector('.modal-content') : null;
            if (c) c.classList.remove('no-side-padding');
        } catch (e) {}
    }

    resetSecModal() {
        const s = this.s;
        if (s.secModal) s.secModal.style.display = "none";
        s.currentToolsContext = [];
        s.currentToolIndex = -1;
        try { document.body.style.overflow = ''; } catch (e) {}
        try {
            const c = s.secModal ? s.secModal.querySelector('.modal-content') : null;
            if (c) c.classList.remove('no-side-padding');
        } catch (e) {}
    }

    showVideo(id) {
        const s = this.s;
        const ex = document.getElementById("big-image-view");
        if (ex) ex.remove();
        if (s.videoFrame) {
            s.videoFrame.style.display = "block";
            s.videoFrame.src = `https://www.youtube.com/embed/${id}`;
        }
    }

    showImage(src) {
        const s = this.s;
        if (s.videoFrame) {
            s.videoFrame.style.display = "none";
            s.videoFrame.src = "";
        }
        const ex = document.getElementById("big-image-view");
        if (ex) ex.remove();
        const big = document.createElement('img');
        big.id = "big-image-view";
        big.src = this.fixImagePath(src);
        if (s.mediaContainer) s.mediaContainer.appendChild(big);
    }

    navigateItem(direction) {
        const s = this.s;
        if (!s.currentItemCard) return;
        let container, itemSelector;
        if (s.isSkillsPage) {
            container = s.skillsList;
            itemSelector = '.skill-item';
        } else if (s.isPortfolioPage) {
            container = s.portfolioGrid;
            itemSelector = '.portfolio-card';
        } else if (s.isAchievementsPage) {
            container = s.achievementsList;
            itemSelector = '.achievement-card';
        } else return;

        const allItems = Array.from(container.querySelectorAll(itemSelector));
        const visibleItems = allItems.filter(item => item.style.display !== 'none');
        if (visibleItems.length <= 1) return;
        const currentIndex = visibleItems.indexOf(s.currentItemCard);
        const nextIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
        s.currentItemCard = visibleItems[nextIndex];
        this.openModalForItem(s.currentItemCard);
    }

    navigateTool(direction) {
        const s = this.s;
        if (!s.currentToolsContext.length) return;
        s.currentToolIndex = (s.currentToolIndex + direction + s.currentToolsContext.length) % s.currentToolsContext.length;
        const nextToolName = s.currentToolsContext[s.currentToolIndex];
        const skillMatch = s.allData && s.allData.skills
            ? s.allData.skills.find(sk => sk.name.toLowerCase() === nextToolName.toLowerCase())
            : null;
        if (skillMatch) this.openModalForItem(skillMatch, 'skill', s.currentToolsContext);
    }

    openModalForItem(cardOrData, typeOverride = null, toolsContext = null) {
        const s = this.s;
        const isSkill = (cardOrData instanceof HTMLElement)
            ? cardOrData.classList.contains('skill-item')
            : (typeOverride === 'skill');
        const data = (cardOrData instanceof HTMLElement) ? cardOrData.dataset : cardOrData;
        const useSecondary = isSkill && s.modal && s.modal.style.display === "flex" && s.secModal && toolsContext;
        const targetModal = useSecondary ? s.secModal : s.modal;
        const prefix = useSecondary ? "sec-" : "";

        if (useSecondary && toolsContext) {
            s.currentToolsContext = toolsContext;
            s.currentToolIndex = s.currentToolsContext.findIndex(n => n.toLowerCase() === data.name.toLowerCase());
        }

        if (!useSecondary) {
            s.currentGalleryIndex = 0;
            const modalBody = document.querySelector(".modal-body-split");
            const modalContent = document.querySelector(".modal-content");
            if (modalBody) modalBody.scrollTop = 0;
            if (modalContent) modalContent.scrollTop = 0;

            const container = s.isSkillsPage ? s.skillsList : s.portfolioGrid;
            const itemSelector = s.isSkillsPage ? '.skill-item' : '.portfolio-card';
            s.currentItemCard = (cardOrData instanceof HTMLElement) ? cardOrData : null;
            const visibleItems = container
                ? Array.from(container.querySelectorAll(itemSelector)).filter(item => item.style.display !== 'none')
                : [];
            if (s.prevBtn) s.prevBtn.style.visibility = (s.currentItemCard && visibleItems.length > 1) ? 'visible' : 'hidden';
            if (s.nextBtn) s.nextBtn.style.visibility = (s.currentItemCard && visibleItems.length > 1) ? 'visible' : 'hidden';

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
            if (titleMain) titleMain.innerText = data.name.toUpperCase().trim();

            const bioDesc = document.getElementById(prefix + 'bio-description');
            if (bioDesc) bioDesc.innerText = data.info || "No description available.";

            const modalIcon = document.getElementById(prefix + 'modal-skill-icon');
            if (modalIcon) {
                modalIcon.src = this.fixImagePath(data.icon || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('img').src : ""));
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
                if (s.secPrevBtn) s.secPrevBtn.style.display = (s.currentToolsContext.length > 1) ? 'flex' : 'none';
                if (s.secNextBtn) s.secNextBtn.style.display = (s.currentToolsContext.length > 1) ? 'flex' : 'none';
            } else {
                if (s.videoFrame) s.videoFrame.style.display = 'none';
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

            const youtubeID = data.youtube || '';
            const galleryData = Array.isArray(data.gallery) ? data.gallery.join(',') : (data.gallery || '');
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
                    const tools = toolsStr.split(',').map(t => t.trim());
                    tools.forEach(tool => {
                        const tag = document.createElement('span');
                        tag.className = 'software-tag';
                        const skillMatch = (s.allData && s.allData.skills) ? (
                                s.allData.skills.find(sk => sk.name.toLowerCase() === tool.toLowerCase())
                                || s.allData.skills.find(sk => sk.name.toLowerCase().includes(tool.toLowerCase()))
                                || s.allData.skills.find(sk => tool.toLowerCase().includes(sk.name.toLowerCase()))
                            ) : null;
                        if (skillMatch && skillMatch.icon) {
                            const icon = document.createElement('img');
                            icon.src = this.fixImagePath(skillMatch.icon);
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
                        if (skillMatch && skillMatch.certified) {
                            const cert = document.createElement('span');
                            cert.className = 'grid-certified-badge';
                            cert.title = skillMatch.certName || 'Certified';
                            cert.innerText = 'CERTIFIED';
                            tag.appendChild(cert);
                        }
                        if (skillMatch) {
                            tag.classList.add('clickable-tool');
                            tag.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const toolList = toolsStr.split(',').map(t => t.trim());
                                this.openModalForItem(skillMatch, 'skill', toolList);
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
            if (modalDate) modalDate.innerText = Utils.formatFullDate(rawDate).toUpperCase();

            if (youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE") {
                this.showVideo(youtubeID);
                if (s.videoFrame) s.videoFrame.style.display = 'block';
            } else {
                if (s.videoFrame) {
                    s.videoFrame.style.display = 'none';
                    s.videoFrame.src = "";
                }
                const firstImg = galleryData ? galleryData.split(',')[0].trim() : "";
                if (firstImg) this.showImage(firstImg);
            }

            const galleryImages = galleryData ? galleryData.split(',').map(s => s.trim()) : [];
            if (galleryImages.length > 0) {
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
                        s.currentGalleryIndex = 0;
                        updateSelection(0);
                        this.centerItemInGallery(gallery, videoBtn);
                        this.showVideo(youtubeID);
                        this.updateGalleryButtons(gallery, mPrev, mNext);
                    });
                    gallery.appendChild(videoBtn);
                    galleryIndexOffset = 1;
                }

                galleryImages.forEach((src, idx) => {
                    const img = document.createElement('img');
                    img.src = this.fixImagePath(src);
                    img.alt = `Screenshot ${idx + 1}`;
                    const myIndex = idx + galleryIndexOffset;
                    if (!hasVideo && idx === 0) img.classList.add('selected');
                    img.addEventListener('click', () => {
                        s.currentGalleryIndex = myIndex;
                        updateSelection(myIndex);
                        this.centerItemInGallery(gallery, img);
                        this.showImage(src);
                        this.updateGalleryButtons(gallery, mPrev, mNext);
                    });
                    gallery.appendChild(img);
                });

                this.initGalleryDrag(gallery);

                if (gallery.children.length > 1) {
                    const gPrev = document.createElement('button');
                    gPrev.id = "gallery-prev";
                    gPrev.className = "gallery-nav-btn prev";
                    gPrev.innerHTML = "&#10094;";
                    gPrev.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.navigateGallery(gallery, -1, gPrev, gNext);
                    });
                    const gNext = document.createElement('button');
                    gNext.id = "gallery-next";
                    gNext.className = "gallery-nav-btn next";
                    gNext.innerHTML = "&#10095;";
                    gNext.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.navigateGallery(gallery, 1, gPrev, gNext);
                    });
                    const wrapper = document.createElement('div');
                    wrapper.className = 'gallery-container-wrapper';
                    gallery.parentNode.insertBefore(wrapper, gallery);
                    wrapper.appendChild(gPrev);
                    wrapper.appendChild(gallery);
                    wrapper.appendChild(gNext);
                    this.updateGalleryButtons(gallery, gPrev, gNext);
                }
            }
        }

        if (targetModal) {
            targetModal.style.display = "flex";
            targetModal.style.zIndex = 99999;
            try { document.body.style.overflow = 'hidden'; } catch (e) {}
            const content = targetModal.querySelector('.modal-content');
            if (content) content.style.display = 'flex';
            this.adjustModalPadding(targetModal);
        }
    }

    navigateGallery(gallery, direction, gPrev, gNext) {
        const s = this.s;
        const items = Array.from(gallery.children).filter(child => !child.classList.contains('gallery-nav-btn'));
        if (items.length === 0) return;
        let newIndex = s.currentGalleryIndex + direction;
        if (newIndex >= items.length) newIndex = 0;
        else if (newIndex < 0) newIndex = items.length - 1;
        s.currentGalleryIndex = newIndex;
        const targetItem = items[s.currentGalleryIndex];
        targetItem.click();
        this.centerItemInGallery(gallery, targetItem);
        this.updateGalleryButtons(gallery, gPrev, gNext);
    }

    updateGalleryButtons(gallery, gPrev, gNext) {
        if (!gPrev || !gNext) return;
        const items = Array.from(gallery.children).filter(child => !child.classList.contains('gallery-nav-btn'));
        const shouldShow = items.length > 1;
        gPrev.style.visibility = shouldShow ? 'visible' : 'hidden';
        gNext.style.visibility = shouldShow ? 'visible' : 'hidden';
    }

    adjustModalPadding(targetModal) {
        const s = this.s;
        if (!targetModal) return;
        const content = targetModal.querySelector('.modal-content');
        let prev = s.prevBtn;
        let next = s.nextBtn;
        if (targetModal === s.secModal) {
            prev = s.secPrevBtn || prev;
            next = s.secNextBtn || next;
        }
        try {
            const prevVis = prev ? getComputedStyle(prev).visibility : 'hidden';
            const nextVis = next ? getComputedStyle(next).visibility : 'hidden';
            if (content) {
                if (prevVis === 'hidden' && nextVis === 'hidden') content.classList.add('no-side-padding');
                else content.classList.remove('no-side-padding');
            }
        } catch (e) {}
    }

    centerItemInGallery(container, item) {
        const cRect = container.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        const target = (iRect.left - cRect.left) + container.scrollLeft + (iRect.width / 2) - (container.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth)), behavior: 'smooth' });
    }

    initGalleryDrag(slider) {
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
                            this.centerItemInGallery(slider, closestItem);
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
}
