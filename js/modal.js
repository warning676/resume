class ModalManager {
    constructor(state) {
        this.s = state;
        this.galleryLoadId = 0;
        this.modalFadeMs = 180;
        this.modalTransitionToken = 0;
        this.skillIconPreloadRadius = 2;
    }

    syncPageScrollLock(locked) {
        Utils.syncPageScrollLock(locked);
    }

    fadeInModal(modalEl) {
        if (!modalEl) return;
        if (modalEl._fadeTimer) {
            clearTimeout(modalEl._fadeTimer);
            modalEl._fadeTimer = null;
        }
        if (modalEl.style.display === 'flex') {
            modalEl.style.opacity = '1';
            return;
        }
        const contentEl = modalEl.querySelector('.modal-content, .external-link-modal-content');
        modalEl.style.transition = `opacity ${this.modalFadeMs}ms ease`;
        modalEl.style.opacity = '0';
        modalEl.style.display = 'flex';
        if (contentEl) {
            contentEl.style.transition = `transform ${this.modalFadeMs}ms ease`;
            contentEl.style.transform = 'translateY(8px)';
        }
        requestAnimationFrame(() => {
            modalEl.style.opacity = '1';
            if (contentEl) contentEl.style.transform = 'translateY(0)';
        });
    }

    fadeOutModal(modalEl, onDone) {
        if (!modalEl) {
            if (typeof onDone === 'function') onDone();
            return;
        }
        if (modalEl._fadeTimer) {
            clearTimeout(modalEl._fadeTimer);
            modalEl._fadeTimer = null;
        }
        if (modalEl.style.display !== 'flex') {
            modalEl.style.display = 'none';
            modalEl.style.opacity = '';
            if (typeof onDone === 'function') onDone();
            return;
        }
        const contentEl = modalEl.querySelector('.modal-content, .external-link-modal-content');
        modalEl.style.transition = `opacity ${this.modalFadeMs}ms ease`;
        modalEl.style.opacity = '0';
        if (contentEl) {
            contentEl.style.transition = `transform ${this.modalFadeMs}ms ease`;
            contentEl.style.transform = 'translateY(8px)';
        }
        modalEl._fadeTimer = setTimeout(() => {
            modalEl.style.display = 'none';
            modalEl.style.opacity = '';
            if (contentEl) contentEl.style.transform = '';
            modalEl._fadeTimer = null;
            if (typeof onDone === 'function') onDone();
        }, this.modalFadeMs + 20);
    }

    fixImagePath(path) {
        if (!path) return path;
        if (path.startsWith('http') || path.startsWith('data:')) {
            if (path.includes('drive.google.com')) {
                if (!path.includes('thumbnail?')) {
                    const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/) || path.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    if (fileIdMatch) {
                        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1200`;
                    }
                }
            }
            return path;
        }
        if (path.startsWith('../')) return encodeURI(path);
        return '../' + encodeURI(path);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    preloadImage(src, timeoutMs) {
        return new Promise(resolve => {
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
            const timerId = setTimeout(() => finish(false, src), timeoutMs || 3000);
            const afterPixelsReady = () => {
                if (typeof img.decode === 'function') {
                    img.decode().then(() => finish(true, src)).catch(() => finish(true, src));
                } else {
                    finish(true, src);
                }
            };
            img.onload = () => afterPixelsReady();
            img.onerror = () => finish(false, src);
            img.src = src;
        });
    }

    preloadToolIconsForItem(cardOrData, typeOverride = null) {
        const s = this.s;
        const isSkill = (cardOrData instanceof HTMLElement)
            ? cardOrData.classList.contains('skill-item')
            : (typeOverride === 'skill');
        if (isSkill) return;
        const data = (cardOrData instanceof HTMLElement) ? cardOrData.dataset : cardOrData;
        const toolsStr = data && data.tools ? String(data.tools) : '';
        if (!toolsStr) return;
        const skills = (s.allData && Array.isArray(s.allData.skills)) ? s.allData.skills : [];
        if (!skills.length) return;
        const tools = toolsStr.split(',').map(t => t.trim()).filter(Boolean);
        const seen = new Set();
        tools.forEach(tool => {
            const key = tool.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            const skillMatch = skills.find(sk => (sk && sk.name && String(sk.name).toLowerCase() === key))
                || skills.find(sk => (sk && sk.name && String(sk.name).toLowerCase().includes(key)))
                || skills.find(sk => (sk && sk.name && key.includes(String(sk.name).toLowerCase())));
            if (!skillMatch || !skillMatch.icon) return;
            const src = this.fixImagePath(skillMatch.icon);
            this.preloadImage(src, 2000);
        });
    }

    preloadSkillIconForItem(cardOrData, typeOverride = null) {
        const isSkill = (cardOrData instanceof HTMLElement)
            ? cardOrData.classList.contains('skill-item')
            : (typeOverride === 'skill');
        if (!isSkill) return;
        const data = (cardOrData instanceof HTMLElement) ? cardOrData.dataset : cardOrData;
        const rawSrc = (data && data.icon)
            ? String(data.icon)
            : (cardOrData instanceof HTMLElement && cardOrData.querySelector('img') ? cardOrData.querySelector('img').src : '');
        const src = this.fixImagePath(rawSrc || '');
        if (!src) return;
        this.preloadImage(src, 2000);
    }

    preloadSkillIconByName(name) {
        const s = this.s;
        const key = String(name || '').trim().toLowerCase();
        if (!key) return;
        const skills = (s.allData && Array.isArray(s.allData.skills)) ? s.allData.skills : [];
        if (!skills.length) return;
        const match = skills.find(sk => sk && sk.name && String(sk.name).trim().toLowerCase() === key);
        if (!match || !match.icon) return;
        const src = this.fixImagePath(match.icon);
        if (!src) return;
        this.preloadImage(src, 2000);
    }

    preloadAdjacentSkillIconsFromContext(toolsContext, currentIndex) {
        const ctx = Array.isArray(toolsContext) ? toolsContext : [];
        if (ctx.length <= 1) return;
        const center = typeof currentIndex === 'number' ? currentIndex : -1;
        if (center < 0) return;
        const r = Math.max(1, this.skillIconPreloadRadius || 1);
        for (let delta = -r; delta <= r; delta++) {
            if (delta === 0) continue;
            const idx = (center + delta + ctx.length) % ctx.length;
            this.preloadSkillIconByName(ctx[idx]);
        }
    }

    preloadAdjacentSkillIconsFromDom(container, itemSelector, currentEl) {
        if (!container || !itemSelector || !currentEl) return;
        const allItems = Array.from(container.querySelectorAll(itemSelector));
        const visibleItems = allItems.filter(item => item.style.display !== 'none');
        if (visibleItems.length <= 1) return;
        const center = visibleItems.indexOf(currentEl);
        if (center < 0) return;
        const r = Math.max(1, this.skillIconPreloadRadius || 1);
        for (let delta = -r; delta <= r; delta++) {
            if (delta === 0) continue;
            const idx = (center + delta + visibleItems.length) % visibleItems.length;
            this.preloadSkillIconForItem(visibleItems[idx], 'skill');
        }
    }

    setModalSkillIcon(modalIcon, iconSrc, altText) {
        if (!modalIcon) return;
        const finalSrc = this.fixImagePath(iconSrc || '');
        modalIcon.alt = altText || '';
        const token = (modalIcon._swapToken || 0) + 1;
        modalIcon._swapToken = token;

        if (!finalSrc) {
            modalIcon.removeAttribute('src');
            modalIcon.style.opacity = '';
            return;
        }

        modalIcon.style.opacity = '0';
        this.preloadImage(finalSrc, 2000).then((result) => {
            if (modalIcon._swapToken !== token) return;
            modalIcon.src = finalSrc;
            if (result && result.cached) {
                modalIcon.style.opacity = '1';
                return;
            }
            requestAnimationFrame(() => {
                if (modalIcon._swapToken !== token) return;
                modalIcon.style.opacity = '1';
            });
        }).catch(() => {
            if (modalIcon._swapToken !== token) return;
            modalIcon.src = finalSrc;
            modalIcon.style.opacity = '1';
        });
    }

    getProficiencyBadgeClass(level) {
        const normalizedLevel = String(level || '').toLowerCase().trim();
        if (normalizedLevel === 'beginner') return 'proficiency-beginner';
        if (normalizedLevel === 'intermediate') return 'proficiency-intermediate';
        if (normalizedLevel === 'advanced') return 'proficiency-advanced';
        return 'proficiency-unknown';
    }

    applyProficiencyBadge(levelElement, levelValue) {
        if (!levelElement) return;
        levelElement.classList.remove('proficiency-beginner', 'proficiency-intermediate', 'proficiency-advanced', 'proficiency-unknown');
        levelElement.classList.add('proficiency-badge', this.getProficiencyBadgeClass(levelValue));
    }

    buildGallerySkeletons(gallery, count) {
        if (!gallery || count <= 0) return;
        gallery.innerHTML = '';
        const skeleton = '<div class="gallery-skeleton"></div>';
        for (let i = 0; i < count; i++) {
            gallery.insertAdjacentHTML('beforeend', skeleton);
        }
    }

    ensureGalleryControls(gallery) {
        if (!gallery) return { gPrev: null, gNext: null, wrapper: null };
        if (gallery.parentElement && gallery.parentElement.classList.contains('gallery-container-wrapper')) {
            const wrapper = gallery.parentElement;
            const gPrev = wrapper.querySelector('.gallery-nav-btn.prev');
            const gNext = wrapper.querySelector('.gallery-nav-btn.next');
            return { gPrev, gNext, wrapper };
        }
        const gPrev = document.createElement('button');
        gPrev.id = "gallery-prev";
        gPrev.className = "gallery-nav-btn prev";
        gPrev.setAttribute('aria-label', 'Previous gallery item');
        const gNext = document.createElement('button');
        gNext.id = "gallery-next";
        gNext.className = "gallery-nav-btn next";
        gNext.setAttribute('aria-label', 'Next gallery item');
        const wrapper = document.createElement('div');
        wrapper.className = 'gallery-container-wrapper';
        gallery.parentNode.insertBefore(wrapper, gallery);
        wrapper.appendChild(gPrev);
        wrapper.appendChild(gallery);
        wrapper.appendChild(gNext);
        return { gPrev, gNext, wrapper };
    }

    applyGalleryState() {
        const s = this.s;
        const gallery = s.galleryEl;
        const galleryWrapper = s.galleryWrapper;
        const galleryToggle = s.galleryToggleEl;
        const targetModal = s.galleryTargetModal;
        const collapsed = !!s.galleryCollapsed;
        const canToggle = !!s.canToggleGallery;
        if (targetModal) targetModal.classList.toggle('gallery-collapsed', collapsed);
        if (galleryToggle) {
            galleryToggle.style.display = canToggle ? '' : 'none';
            galleryToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            galleryToggle.setAttribute('aria-label', collapsed ? 'Show gallery' : 'Hide gallery');
        }
        if (!canToggle) {
            if (gallery) gallery.style.display = 'none';
            if (galleryWrapper) galleryWrapper.style.display = 'none';
            return;
        }
        if (!s.galleryHasRendered) {
            if (targetModal) targetModal.classList.toggle('gallery-collapsed', collapsed);
            if (gallery) gallery.style.display = '';
            if (galleryWrapper) galleryWrapper.style.display = '';
            s.galleryHasRendered = true;
            return;
        }

        if (gallery) gallery.style.display = '';
        if (galleryWrapper) galleryWrapper.style.display = '';
    }

    _abortModalTransition(modalEl) {
        if (!modalEl) return;
        if (modalEl._fadeTimer) {
            clearTimeout(modalEl._fadeTimer);
            modalEl._fadeTimer = null;
        }
        const contentEl = modalEl.querySelector('.modal-content, .external-link-modal-content');
        modalEl.style.display = 'none';
        modalEl.style.opacity = '';
        modalEl.style.transition = '';
        if (contentEl) {
            contentEl.style.transform = '';
            contentEl.style.transition = '';
        }
    }

    _finalizeMainModalReset() {
        const s = this.s;
        if (s.videoFrame) s.videoFrame.src = "";
        const ex = document.getElementById("big-image-view");
        if (ex) ex.remove();
        const modalBody = document.querySelector(".modal-body-split");
        if (modalBody) modalBody.scrollTop = 0;
        const modalContent = document.querySelector(".modal-content");
        if (modalContent) modalContent.scrollTop = 0;
        const gal = document.getElementById("modal-gallery");
        if (gal) gal.scrollLeft = 0;
        if (s.modal) s.modal.classList.remove('gallery-collapsed');
        s.galleryCollapsed = false;
        s.canToggleGallery = false;
        s.galleryHasRendered = false;
        s.galleryEl = null;
        s.galleryWrapper = null;
        s.galleryToggleEl = null;
        s.galleryTargetModal = null;
        s.currentItemCard = null;
        s.disableCourseNavigationFromSkillModal = false;
        this.syncPageScrollLock(false);
        try {
            const c = s.modal ? s.modal.querySelector('.modal-content') : null;
            if (c) c.classList.remove('no-side-padding');
        } catch (e) {}
    }

    _finalizeSecModalReset() {
        const s = this.s;
        s.currentToolsContext = [];
        s.currentToolIndex = -1;
        s.disableCourseNavigationFromSkillModal = false;
        this.syncPageScrollLock(false);
        try {
            const c = s.secModal ? s.secModal.querySelector('.modal-content') : null;
            if (c) c.classList.remove('no-side-padding');
        } catch (e) {}
    }

    dismissPortfolioModalsForNavigation() {
        const s = this.s;
        this._abortModalTransition(s.secModal);
        this._abortModalTransition(s.modal);
        s.currentToolsContext = [];
        s.currentToolIndex = -1;
        try {
            const c = s.secModal ? s.secModal.querySelector('.modal-content') : null;
            if (c) c.classList.remove('no-side-padding');
        } catch (e) {}
        this._finalizeMainModalReset();
    }

    resetModal() {
        this.fadeOutModal(this.s.modal, () => this._finalizeMainModalReset());
    }

    resetSecModal() {
        this.fadeOutModal(this.s.secModal, () => this._finalizeSecModalReset());
    }

    showVideo(id, isVertical = false) {
        const s = this.s;
        const ex = document.getElementById("big-image-view");
        if (ex) ex.remove();
        if (s.videoFrame) {
            s.videoFrame.style.display = "block";
            s.videoFrame.src = `https://www.youtube-nocookie.com/embed/${id}`;
        }
        if (s.mediaContainer) {
            if (isVertical) {
                s.mediaContainer.style.paddingBottom = '177.78%';
                s.mediaContainer.style.maxWidth = '400px';
                s.mediaContainer.style.margin = '0 auto';
            } else {
                s.mediaContainer.style.paddingBottom = '56.25%';
                s.mediaContainer.style.maxWidth = '';
                s.mediaContainer.style.margin = '';
            }
        }
    }

    showImage(src) {
        const s = this.s;
        if (s.videoFrame) {
            s.videoFrame.style.display = "none";
            s.videoFrame.src = "";
        }
        if (s.mediaContainer) {
            s.mediaContainer.style.paddingBottom = '56.25%';
            s.mediaContainer.style.maxWidth = '';
            s.mediaContainer.style.margin = '';
        }
        const ex = document.getElementById("big-image-view");
        if (ex) ex.remove();
        const mediaSkeleton = document.querySelector('.media-skeleton');
        if (mediaSkeleton) mediaSkeleton.remove();
        const big = document.createElement('img');
        big.id = "big-image-view";
        big.src = this.fixImagePath(src);
        if (s.mediaContainer) s.mediaContainer.appendChild(big);
    }

    navigateItem(direction) {
        const s = this.s;
        const isSkillModal = s.modal && s.modal.classList.contains('modal-skill');
        
        if (s.isAchievementsPage && !isSkillModal && s.achievementVideos && s.achievementVideos.length > 1) {
            const currentIndex = s.currentAchievementVideoIndex;
            if (currentIndex < 0) return;
            const nextIndex = (currentIndex + direction + s.achievementVideos.length) % s.achievementVideos.length;
            s.currentAchievementVideoIndex = nextIndex;
            const nextVideo = s.achievementVideos[nextIndex];
            if (nextVideo) this.openModalForItemWithTransition(nextVideo, direction);
            return;
        }
        
        if (!s.currentItemCard) return;
        let container, itemSelector;
        if (s.isSkillsPage || (s.isAchievementsPage && isSkillModal)) {
            container = s.skillsList;
            itemSelector = '.skill-item';
        } else if (s.isPortfolioPage) {
            container = s.portfolioGrid;
            itemSelector = '.portfolio-card';
        } else if (s.isAchievementsPage) {
            return;
        } else return;

        const allItems = Array.from(container.querySelectorAll(itemSelector));
        const visibleItems = allItems.filter(item => item.style.display !== 'none');
        if (visibleItems.length <= 1) return;
        let currentIndex = visibleItems.indexOf(s.currentItemCard);
        if (currentIndex === -1) {
            currentIndex = 0;
        }
        const nextIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
        s.currentItemCard = visibleItems[nextIndex];
        if (isSkillModal) this.preloadAdjacentSkillIconsFromDom(container, itemSelector, s.currentItemCard);
        this.openModalForItemWithTransition(s.currentItemCard, direction);
    }

    navigateTool(direction) {
        const s = this.s;
        if (!s.currentToolsContext.length) return;
        s.currentToolIndex = (s.currentToolIndex + direction + s.currentToolsContext.length) % s.currentToolsContext.length;
        this.preloadAdjacentSkillIconsFromContext(s.currentToolsContext, s.currentToolIndex);
        const nextToolName = s.currentToolsContext[s.currentToolIndex];
        const skillMatch = s.allData && s.allData.skills
            ? s.allData.skills.find(sk => sk.name.toLowerCase() === nextToolName.toLowerCase())
            : null;
        if (skillMatch) this.openModalForItemWithTransition(skillMatch, direction, 'skill', s.currentToolsContext);
    }

    openModalForItemWithTransition(cardOrData, direction, typeOverride = null, toolsContext = null) {
        const s = this.s;
        const isSkill = (cardOrData instanceof HTMLElement)
            ? cardOrData.classList.contains('skill-item')
            : (typeOverride === 'skill');
        if (isSkill) {
            this.preloadSkillIconForItem(cardOrData, typeOverride);
            if (Array.isArray(toolsContext) && toolsContext.length) {
                const data = (cardOrData instanceof HTMLElement) ? cardOrData.dataset : cardOrData;
                const idx = toolsContext.findIndex(n => String(n || '').toLowerCase() === String((data && data.name) || '').toLowerCase());
                this.preloadAdjacentSkillIconsFromContext(toolsContext, idx >= 0 ? idx : s.currentToolIndex);
            } else if (cardOrData instanceof HTMLElement && s.skillsList) {
                this.preloadAdjacentSkillIconsFromDom(s.skillsList, '.skill-item', cardOrData);
            }
        } else {
            this.preloadToolIconsForItem(cardOrData, typeOverride);
        }
        const useSecondary = isSkill && s.modal && s.modal.style.display === "flex" && s.secModal && toolsContext;
        const targetModal = useSecondary ? s.secModal : s.modal;
        const transitionTarget = targetModal ? targetModal.querySelector('.modal-info-pane') : null;
        let headerTransitionTarget = null;
        if (targetModal) {
            if (useSecondary) {
                headerTransitionTarget = targetModal.querySelector('.modal-header > div');
            } else if (isSkill) {
                headerTransitionTarget = targetModal.querySelector('#skill-header');
            } else {
                headerTransitionTarget = targetModal.querySelector('#project-header');
            }
        }
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!transitionTarget || prefersReducedMotion) {
            this.openModalForItem(cardOrData, typeOverride, toolsContext);
            return;
        }

        const durationMs = 150;
        const exitShift = direction >= 0 ? -12 : 12;
        const enterShift = -exitShift;
        const transitionToken = ++this.modalTransitionToken;
        if (targetModal) {
            targetModal._morphActive = true;
            if (targetModal._morphTimer) {
                clearTimeout(targetModal._morphTimer);
                targetModal._morphTimer = null;
            }
        }

        transitionTarget.style.willChange = 'opacity, transform';
        transitionTarget.style.transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`;
        transitionTarget.style.opacity = '0';
        transitionTarget.style.transform = `translate3d(${exitShift}px, 0, 0)`;
        if (headerTransitionTarget) {
            headerTransitionTarget.style.willChange = 'opacity, transform';
            headerTransitionTarget.style.transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`;
            headerTransitionTarget.style.opacity = '0';
            headerTransitionTarget.style.transform = `translate3d(${exitShift}px, 0, 0)`;
        }

        const performSwap = () => {
            if (transitionToken !== this.modalTransitionToken) return;
            this.openModalForItem(cardOrData, typeOverride, toolsContext);
            transitionTarget.style.transition = 'none';
            transitionTarget.style.opacity = '0';
            transitionTarget.style.transform = `translate3d(${enterShift}px, 0, 0)`;
            if (headerTransitionTarget) {
                headerTransitionTarget.style.transition = 'none';
                headerTransitionTarget.style.opacity = '0';
                headerTransitionTarget.style.transform = `translate3d(${enterShift}px, 0, 0)`;
            }

            requestAnimationFrame(() => {
                if (transitionToken !== this.modalTransitionToken) return;
                transitionTarget.style.transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`;
                transitionTarget.style.opacity = '1';
                transitionTarget.style.transform = 'translate3d(0px, 0, 0)';
                if (headerTransitionTarget) {
                    headerTransitionTarget.style.transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`;
                    headerTransitionTarget.style.opacity = '1';
                    headerTransitionTarget.style.transform = 'translate3d(0px, 0, 0)';
                }

                const cleanup = () => {
                    if (transitionToken !== this.modalTransitionToken) return;
                    transitionTarget.style.transition = '';
                    transitionTarget.style.opacity = '';
                    transitionTarget.style.transform = 'translate3d(0px, 0, 0)';
                    transitionTarget.style.willChange = '';
                    if (headerTransitionTarget) {
                        headerTransitionTarget.style.transition = '';
                        headerTransitionTarget.style.opacity = '';
                        headerTransitionTarget.style.transform = '';
                        headerTransitionTarget.style.willChange = '';
                    }
                    if (targetModal) {
                        targetModal._morphActive = false;
                        targetModal._morphTimer = null;
                    }
                };

                if (targetModal) {
                    targetModal._morphTimer = setTimeout(cleanup, durationMs + 30);
                } else {
                    setTimeout(cleanup, durationMs + 30);
                }
            });
        };

        if (targetModal) {
            targetModal._morphTimer = setTimeout(performSwap, durationMs);
        } else {
            setTimeout(performSwap, durationMs);
        }
    }

    populateSkillModalCourseProjectRows(prefix, data) {
        const s = this.s;
        const wrap = document.getElementById(prefix + 'modal-skill-course-project-cards-wrap');
        const container = document.getElementById(prefix + 'modal-skill-course-project-cards');
        const label = document.getElementById(prefix + 'modal-skill-course-project-cards-label');
        if (!wrap || !container) return 0;
        const skillKey = String(data.name || '').trim();
        const getRows = s.getCourseProjectRowsForSkill;
        const rows = typeof getRows === 'function' ? getRows(skillKey) : [];
        container.innerHTML = '';
        if (!rows.length) {
            wrap.style.display = 'none';
            if (label) label.style.display = '';
            return 0;
        }
        wrap.style.display = 'block';
        if (label) label.style.display = 'none';
        const parseLangs = s.parseCourseLanguagesUsedRaw;
        const appendTags = s.appendSoftwareLanguageTagsToContainer;
        rows.forEach(row => {
            const name = String(row.name || '').trim() || 'Project';
            const linkRaw = String(row.link || '').trim();
            const hasLink = /^https?:\/\//i.test(linkRaw);
            const projInfo = String(row.info || '').trim();
            const courseId = String(row.id ?? row.courseid ?? row.courseId ?? '').trim();
            const courseTitleToken = (courseId || 'Course').toUpperCase();
            const card = document.createElement('div');
            card.className = 'modal-skill-course-project-card modal-skill-course-project-card-surface';
            const sectionLabel = document.createElement('small');
            sectionLabel.className = 'courses-modal-featured-label';
            sectionLabel.textContent = `FEATURED PROJECT FROM ${courseTitleToken}`;
            card.appendChild(sectionLabel);
            if (hasLink) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'inline-action-button courses-modal-featured-link';
                btn.textContent = name;
                btn.style.setProperty('--inline-action-color', '#58a6ff');
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const fn = typeof window !== 'undefined' ? window.openExternalLinkWithPrompt : null;
                    if (typeof fn === 'function') fn(linkRaw, name, 'Featured Project', projInfo);
                });
                card.appendChild(btn);
            } else {
                const span = document.createElement('span');
                span.className = 'modal-skill-course-project-card-title';
                span.textContent = name;
                card.appendChild(span);
            }
            if (courseId) {
                const shouldDisableCourseNav = !!(
                    s.disableCourseNavigationFromSkillModal
                    || (s.coursesModal && s.coursesModal.style.display === 'flex')
                );
                if (shouldDisableCourseNav) {
                    const courseText = document.createElement('span');
                    courseText.className = 'software-tag modal-skill-course-project-course-id-below modal-skill-course-project-course-id-static';
                    courseText.textContent = courseId;
                    courseText.setAttribute('aria-disabled', 'true');
                    card.appendChild(courseText);
                } else {
                    const courseBtn = document.createElement('button');
                    courseBtn.type = 'button';
                    courseBtn.className = 'inline-action-button courses-modal-featured-link modal-skill-course-project-course-id-below';
                    courseBtn.textContent = courseId;
                    courseBtn.style.setProperty('--inline-action-color', '#58a6ff');
                    courseBtn.setAttribute('aria-label', `Open course ${courseId} on the Courses page`);
                    courseBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const opener = typeof window !== 'undefined' ? window.openCoursesModalForCourseIdFromSkill : null;
                        if (typeof opener === 'function') {
                            opener(courseId);
                        } else if (typeof window.navigateToSearchResult === 'function') {
                            if (typeof this.dismissPortfolioModalsForNavigation === 'function') {
                                this.dismissPortfolioModalsForNavigation();
                            }
                            window.navigateToSearchResult('/courses', courseId, 'course');
                        }
                    });
                    card.appendChild(courseBtn);
                }
            }
            if (projInfo) {
                const p = document.createElement('p');
                p.className = 'courses-modal-featured-desc';
                p.style.display = 'block';
                p.textContent = projInfo;
                card.appendChild(p);
            }
            const projectLangs = typeof parseLangs === 'function'
                ? parseLangs(row.languagesUsed || row.languagesused)
                : [];
            if (projectLangs.length && typeof appendTags === 'function') {
                const langWrap = document.createElement('div');
                langWrap.className = 'courses-modal-featured-lang-wrap modal-skill-course-project-card-lang-wrap';
                langWrap.style.display = 'block';
                const langLabel = document.createElement('small');
                langLabel.className = 'courses-modal-featured-project-lang-label';
                langLabel.textContent = projectLangs.length === 1 ? 'Project Language' : 'Project Languages';
                const langContainer = document.createElement('div');
                langContainer.className = 'courses-modal-featured-languages';
                langContainer.setAttribute(
                    'aria-label',
                    projectLangs.length === 1 ? 'Programming language used in featured project' : 'Programming languages used in featured project'
                );
                appendTags(langContainer, projectLangs, projectLangs, skillKey ? { nonInteractiveSkillName: skillKey } : undefined);
                langWrap.appendChild(langLabel);
                langWrap.appendChild(langContainer);
                card.appendChild(langWrap);
            }
            container.appendChild(card);
        });
        return rows.length;
    }

    openModalForItem(cardOrData, typeOverride = null, toolsContext = null) {
        const s = this.s;
        const coursesModalEl = document.getElementById('courses-modal');
        if (coursesModalEl && coursesModalEl.classList.contains('courses-modal-over-modal') && coursesModalEl.style.display === 'flex') {
            const closer = typeof window !== 'undefined' ? window.closeCoursesModal : null;
            if (typeof closer === 'function') closer();
        }
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
            this.galleryLoadId += 1;
            const modalBody = document.querySelector(".modal-body-split");
            const modalContent = document.querySelector(".modal-content");
            if (modalBody) modalBody.scrollTop = 0;
            if (modalContent) modalContent.scrollTop = 0;

            const container = s.isSkillsPage ? s.skillsList : s.portfolioGrid;
            const itemSelector = s.isSkillsPage ? '.skill-item' : '.portfolio-card';
            s.currentItemCard = (cardOrData instanceof HTMLElement) ? cardOrData : null;
            if (!s.currentItemCard && container && data && data.name) {
                const cards = Array.from(container.querySelectorAll(itemSelector));
                s.currentItemCard = cards.find(c => String(c.getAttribute('data-name')).toLowerCase() === String(data.name).toLowerCase()) || null;
            }
            
            const visibleItems = container
                ? Array.from(container.querySelectorAll(itemSelector)).filter(item => item.style.display !== 'none')
                : [];
            
            const showAchievementNav = s.isAchievementsPage && s.achievementVideos && s.achievementVideos.length > 1;
            const showRegularNav = s.currentItemCard && visibleItems.length > 1;
            s.showModalNavArrows = showAchievementNav || showRegularNav;
            if (s.prevBtn) s.prevBtn.style.visibility = s.showModalNavArrows ? 'visible' : 'hidden';
            if (s.nextBtn) s.nextBtn.style.visibility = s.showModalNavArrows ? 'visible' : 'hidden';

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
                this.setModalSkillIcon(
                    modalIcon,
                    data.icon || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('img').src : ''),
                    data.name
                );
            }

            const sType = document.getElementById(prefix + 'modal-skill-type');
            if (sType) sType.innerText = data.badge || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('.type-badge').innerText : "");

            const sLevel = document.getElementById(prefix + 'modal-skill-level');
            if (sLevel) {
                const levelValue = data.level || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('.level').innerText : "-");
                sLevel.innerText = levelValue;
                this.applyProficiencyBadge(sLevel, levelValue);
            }

            const sLast = document.getElementById(prefix + 'modal-skill-last');
            if (sLast) sLast.innerText = data.lastUsed || (cardOrData instanceof HTMLElement ? cardOrData.querySelector('.last-used').innerText : "-");

            const certContainer = document.getElementById(prefix + 'modal-skill-cert-container');
            const certName = document.getElementById(prefix + 'modal-skill-cert-name');
            if (certContainer && certName) {
                const isCertified = data.certified === true || String(data.certified || '').toLowerCase() === 'true';
                const fallbackCertName = data.certName || data.name || (cardOrData instanceof HTMLElement ? cardOrData.getAttribute('data-cert-name') : '') || '-';
                if (isCertified) {
                    certContainer.style.display = "block";
                    certName.innerText = fallbackCertName;
                } else {
                    certContainer.style.display = "none";
                    certName.innerText = "-";
                }
            }

            const courseProjectCardCount = this.populateSkillModalCourseProjectRows(prefix, data);

            const langWrap = document.getElementById(prefix + 'modal-skill-course-project-lang-wrap');
            const langContainer = document.getElementById(prefix + 'modal-skill-course-project-languages');
            const langLabel = document.getElementById(prefix + 'modal-skill-course-project-lang-label');
            if (langWrap && langContainer) {
                if (courseProjectCardCount > 0) {
                    langWrap.style.display = 'none';
                    langContainer.innerHTML = '';
                } else {
                    const skillKey = String(data.name || '').trim();
                    const getLangs = s.getAggregatedCourseProjectLanguagesForSkill;
                    const appendTags = s.appendSoftwareLanguageTagsToContainer;
                    const projectLangs = typeof getLangs === 'function' ? getLangs(skillKey) : [];
                    if (projectLangs.length && typeof appendTags === 'function') {
                        langWrap.style.display = 'block';
                        if (langLabel) {
                            langLabel.textContent = projectLangs.length === 1 ? 'Course project language' : 'Course project languages';
                        }
                        langContainer.setAttribute(
                            'aria-label',
                            projectLangs.length === 1
                                ? 'Programming language from course projects using this skill'
                                : 'Programming languages from course projects using this skill'
                        );
                        appendTags(langContainer, projectLangs, projectLangs, { nonInteractiveSkillName: skillKey });
                    } else {
                        langWrap.style.display = 'none';
                        langContainer.innerHTML = '';
                    }
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


            const galleryData = Array.isArray(data.gallery) ? data.gallery.join(',') : (data.gallery || '');
            const rawDate = data.date;
            const toolsStr = data.tools;
            const info = data.info;
            
            const youtubeID = Utils.extractYouTubeID(data.youtube || '');
            const isVerticalVideo = youtubeID && data.youtube && 
                (data.youtube.includes('/shorts/') || data.youtube.toLowerCase().includes('shorts'));

            const modalTitle = document.getElementById("modal-title");
            if (modalTitle) modalTitle.innerText = data.name.toUpperCase();

            const infoTitle = document.getElementById("modal-info-title");
            if (infoTitle) infoTitle.innerText = data.name ? data.name.toUpperCase() : "";

            const infoCategory = document.getElementById("modal-info-category");
            if (infoCategory) {
                infoCategory.textContent = data.badge || "";
                infoCategory.style.display = data.badge ? "inline-block" : "none";
            }

            const modalTools = document.getElementById("modal-tools");
            if (modalTools) {
                modalTools.innerHTML = '';
                if (toolsStr) {
                    const toolIcons = [];
                    let toolIconsLoaded = 0;
                    const clearToolSkeletons = () => {
                        const skeletons = modalTools.querySelectorAll('.tool-icon-skeleton');
                        skeletons.forEach(s => s.remove());
                    };
                    const onToolIconLoad = () => {
                        toolIconsLoaded += 1;
                        if (toolIconsLoaded >= toolIcons.length) clearToolSkeletons();
                    };
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
                            const iconWrap = document.createElement('span');
                            iconWrap.className = 'tool-icon-wrap';

                            const iconSkeleton = document.createElement('span');
                            iconSkeleton.className = 'tool-icon-skeleton skeleton-element';

                            const icon = document.createElement('img');
                            icon.className = 'tool-icon';
                            icon.style.opacity = '0';

                            iconWrap.appendChild(iconSkeleton);
                            iconWrap.appendChild(icon);
                            tag.appendChild(iconWrap);

                            toolIcons.push(icon);
                            const fixedSrc = this.fixImagePath(skillMatch.icon);
                            const token = (icon._swapToken || 0) + 1;
                            icon._swapToken = token;
                            this.preloadImage(fixedSrc, 2000).then(() => {
                                if (!icon.isConnected) return;
                                if (icon._swapToken !== token) return;
                                icon.onload = () => {
                                    if (!icon.isConnected) return;
                                    if (icon._swapToken !== token) return;
                                    icon.style.opacity = '1';
                                    onToolIconLoad();
                                };
                                icon.onerror = () => {
                                    if (!icon.isConnected) return;
                                    if (icon._swapToken !== token) return;
                                    icon.style.opacity = '1';
                                    onToolIconLoad();
                                };
                                icon.src = fixedSrc;
                                if (icon.complete) {
                                    icon.style.opacity = '1';
                                    onToolIconLoad();
                                }
                            }).catch(() => {
                                if (!icon.isConnected) return;
                                if (icon._swapToken !== token) return;
                                icon.style.opacity = '1';
                                onToolIconLoad();
                            });
                        }
                        const text = document.createElement('span');
                        text.innerText = tool.toUpperCase();
                        tag.appendChild(text);
                        if (skillMatch && skillMatch.certified) {
                            const cert = document.createElement('span');
                            cert.className = 'grid-certified-badge';
                            cert.title = skillMatch.certName || skillMatch.name || 'Certified';
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
                    if (toolIcons.length === 0) clearToolSkeletons();
                } else {
                    modalTools.innerText = "NONE";
                }
            }

            const modalDesc = document.getElementById("modal-description");
            if (modalDesc) modalDesc.innerText = info;

            const modalDate = document.getElementById("modal-date");
            if (modalDate) {
                const dateStr = rawDate ? Utils.formatFullDate(rawDate).toUpperCase() : '';
                modalDate.textContent = dateStr;
                modalDate.style.display = dateStr ? 'block' : 'none';
            }

            const awardsContainer = document.getElementById("film-festival-awards");
            const awardsList = document.getElementById("awards-list");
            const isGamesPage = s.currentRoute === '/games';
            if (awardsContainer && awardsList && s.filmFestivalAwards && !isGamesPage) {
                const awards = s.filmFestivalAwards[data.name];
                if (awards && awards.length > 0) {
                    awardsContainer.style.display = 'block';
                    awardsList.innerHTML = '';
                    awards.forEach(award => {
                        const locationParts = (award.location || '').split('|').map(part => part.trim());
                        const school = locationParts[0] || '';
                        const festival = locationParts[1] || '';

                        const awardItem = document.createElement('div');
                        awardItem.className = 'modal-award-item';

                        const row = document.createElement('div');
                        row.className = 'modal-award-row';

                        const nameEl = document.createElement('span');
                        nameEl.className = 'film-award-name';
                        nameEl.textContent = (award.award || '').toString();

                        const dateEl = document.createElement('span');
                        dateEl.className = 'modal-award-date';
                        dateEl.textContent = (award.date || '').toString();

                        row.appendChild(nameEl);
                        row.appendChild(dateEl);
                        awardItem.appendChild(row);

                        if (festival || school) {
                            const loc = document.createElement('div');
                            loc.className = 'modal-award-loc';
                            if (festival) {
                                const fe = document.createElement('span');
                                fe.className = 'modal-award-loc-festival';
                                fe.textContent = festival;
                                loc.appendChild(fe);
                            }
                            if (school) {
                                const se = document.createElement('span');
                                se.className = 'modal-award-loc-school';
                                se.textContent = school;
                                loc.appendChild(se);
                            }
                            awardItem.appendChild(loc);
                        }

                        awardsList.appendChild(awardItem);
                    });
                } else {
                    awardsContainer.style.display = 'none';
                }
            } else if (awardsContainer) {
                awardsContainer.style.display = 'none';
            }

            const hasVideo = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";
            const galleryImages = galleryData ? galleryData.split(',').map(s => s.trim()) : [];
            const firstImg = galleryImages.length > 0 ? galleryImages[0] : "";
            const loadId = this.galleryLoadId;
            const gallery = document.getElementById("modal-gallery");
            const galleryToggle = document.getElementById("gallery-toggle");
            const totalGalleryItems = galleryImages.length + (hasVideo ? 1 : 0);
            const shouldShowGallery = totalGalleryItems > 1;
            let galleryWrapper = gallery && gallery.parentElement && gallery.parentElement.classList.contains('gallery-container-wrapper')
                ? gallery.parentElement
                : null;
            let controls = null;
            s.galleryCollapsed = !shouldShowGallery;
            s.canToggleGallery = shouldShowGallery;
            s.galleryHasRendered = false;
            s.galleryEl = gallery;
            s.galleryWrapper = galleryWrapper;
            s.galleryToggleEl = galleryToggle;
            s.galleryTargetModal = targetModal;

            if (galleryToggle && !galleryToggle.hasAttribute('data-toggle-bound')) {
                galleryToggle.setAttribute('data-toggle-bound', 'true');
                galleryToggle.addEventListener('click', () => {
                    if (!this.s.canToggleGallery) return;
                    this.s.galleryCollapsed = !this.s.galleryCollapsed;
                    this.applyGalleryState();
                });
            }
            this.applyGalleryState();

            if (gallery) {
                if (!shouldShowGallery) gallery.innerHTML = '';
            }

            if (hasVideo) {
                this.showVideo(youtubeID, isVerticalVideo);
                if (s.videoFrame) s.videoFrame.style.display = 'block';
            } else {
                if (s.videoFrame) {
                    s.videoFrame.style.display = 'none';
                    s.videoFrame.src = "";
                }
                const bigImg = document.getElementById("big-image-view");
                if (bigImg) bigImg.remove();
                const mediaSkeleton = document.querySelector('.media-skeleton');
                if (mediaSkeleton) mediaSkeleton.remove();
                if (galleryImages.length > 0 && s.mediaContainer) {
                    const skeleton = document.createElement('div');
                    skeleton.className = 'media-skeleton';
                    s.mediaContainer.appendChild(skeleton);
                }
            }

            const initialMediaSrc = hasVideo
                ? `https://i.ytimg.com/vi/${youtubeID}/mqdefault.jpg`
                : (firstImg ? this.fixImagePath(firstImg) : '');
            if (initialMediaSrc) {
                this.preloadImage(initialMediaSrc, 3000).then((result) => {
                    if (loadId !== this.galleryLoadId) return;
                    const mediaSkeleton = document.querySelector('.media-skeleton');
                    if (mediaSkeleton) mediaSkeleton.remove();
                    if (!hasVideo && firstImg) {
                        this.showImage(firstImg);
                        if (gallery && shouldShowGallery) {
                            const fixedFirst = this.fixImagePath(firstImg);
                            const existing = gallery.querySelector(`img[data-gallery-src="${fixedFirst}"]`);
                            if (!existing) {
                                const img = document.createElement('img');
                                img.src = fixedFirst;
                                img.alt = "Screenshot 1";
                                img.setAttribute('data-gallery-src', fixedFirst);
                                img.classList.add('selected');
                                img.addEventListener('click', () => {
                                    s.currentGalleryIndex = 0;
                                    const items = Array.from(gallery.children).filter(child =>
                                        child.tagName === 'IMG' || child.classList.contains('video-thumb-btn')
                                    );
                                    items.forEach((item, i) => {
                                        if (i === 0) item.classList.add('selected');
                                        else item.classList.remove('selected');
                                    });
                                    this.centerItemInGallery(gallery, img);
                                    this.showImage(firstImg);
                                    if (controls) this.updateGalleryButtons(gallery, controls.gPrev, controls.gNext);
                                });
                                const firstSkeleton = gallery.querySelector('.gallery-skeleton');
                                if (firstSkeleton) firstSkeleton.replaceWith(img);
                                else gallery.insertBefore(img, gallery.firstChild);
                            }
                        }
                    }
                });
            }

            if (gallery && shouldShowGallery) {
                controls = this.ensureGalleryControls(gallery);
                if (controls.wrapper) {
                    galleryWrapper = controls.wrapper;
                    s.galleryWrapper = galleryWrapper;
                }
                this.applyGalleryState();
                this.buildGallerySkeletons(gallery, totalGalleryItems);
                this.updateGalleryButtons(gallery, controls.gPrev, controls.gNext);

                const videoThumb = hasVideo ? `https://i.ytimg.com/vi/${youtubeID}/mqdefault.jpg` : '';
                if (hasVideo) {
                    const videoBtn = document.createElement('button');
                    videoBtn.className = 'video-thumb-btn selected';
                    videoBtn.innerHTML = `
                        <img src="${videoThumb}" alt="Video Thumbnail">
                        <div class="video-overlay">
                            <span class="video-play-icon">▶</span>
                            <span class="video-label">VIDEO</span>
                        </div>
                    `;
                    videoBtn.addEventListener('click', () => {
                        s.currentGalleryIndex = 0;
                        const items = Array.from(gallery.children).filter(child =>
                            child.tagName === 'IMG' || child.classList.contains('video-thumb-btn')
                        );
                        items.forEach((item, i) => {
                            if (i === 0) item.classList.add('selected');
                            else item.classList.remove('selected');
                        });
                        this.centerItemInGallery(gallery, videoBtn);
                        this.showVideo(youtubeID, isVerticalVideo);
                        this.updateGalleryButtons(gallery, controls.gPrev, controls.gNext);
                    });
                    const firstSkeleton = gallery.querySelector('.gallery-skeleton');
                    if (firstSkeleton) firstSkeleton.replaceWith(videoBtn);
                    else gallery.insertBefore(videoBtn, gallery.firstChild);
                }

                const preloadTasks = [];
                galleryImages.forEach(src => {
                    const fixed = this.fixImagePath(src);
                    preloadTasks.push(this.preloadImage(fixed, 3000));
                });

                const startTime = Date.now();
                Promise.all(preloadTasks).then(results => {
                    const allCached = results.every(r => r.cached);
                    const loadTime = Date.now() - startTime;
                    const smoothingDelay = allCached ? 0 : Math.max(0, 120 - loadTime);
                    
                    return Promise.all([results, this.delay(smoothingDelay)]);
                }).then(([results]) => {
                    if (loadId !== this.galleryLoadId) return;
                    if (!gallery) return;
                    gallery.querySelectorAll('.gallery-skeleton').forEach(item => item.remove());

                    const updateSelection = (index) => {
                        const items = Array.from(gallery.children).filter(child =>
                            child.tagName === 'IMG' || child.classList.contains('video-thumb-btn')
                        );
                        items.forEach((item, i) => {
                            if (i === index) item.classList.add('selected');
                            else item.classList.remove('selected');
                        });
                    };

                    const mPrev = controls.gPrev || document.getElementById("gallery-prev");
                    const mNext = controls.gNext || document.getElementById("gallery-next");
                    const galleryIndexOffset = hasVideo ? 1 : 0;

                    galleryImages.forEach((src, idx) => {
                        const img = document.createElement('img');
                        const fixedSrc = this.fixImagePath(src);
                        if (gallery.querySelector(`img[data-gallery-src="${fixedSrc}"]`)) return;
                        img.src = fixedSrc;
                        img.alt = `Screenshot ${idx + 1}`;
                        img.setAttribute('data-gallery-src', fixedSrc);
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
                        const nav = this.ensureGalleryControls(gallery);
                        if (nav.gPrev) {
                            nav.gPrev.onclick = (e) => {
                                e.stopPropagation();
                                this.navigateGallery(gallery, -1, nav.gPrev, nav.gNext);
                            };
                        }
                        if (nav.gNext) {
                            nav.gNext.onclick = (e) => {
                                e.stopPropagation();
                                this.navigateGallery(gallery, 1, nav.gPrev, nav.gNext);
                            };
                        }
                        this.updateGalleryButtons(gallery, nav.gPrev, nav.gNext);
                    }

                });
            }
        }

        if (targetModal) {
            this.fadeInModal(targetModal);
            targetModal.style.zIndex = 99999;
            this.syncPageScrollLock(true);
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
        if (targetModal === s.secModal) {
            const prev = s.secPrevBtn;
            const next = s.secNextBtn;
            try {
                const prevStyles = prev ? getComputedStyle(prev) : null;
                const nextStyles = next ? getComputedStyle(next) : null;
                const prevHidden = !prevStyles || prevStyles.display === 'none' || prevStyles.visibility === 'hidden';
                const nextHidden = !nextStyles || nextStyles.display === 'none' || nextStyles.visibility === 'hidden';
                if (content) {
                    const hadTransition = content.style.transition;
                    content.style.transition = 'none';
                    if (prevHidden && nextHidden) content.classList.add('no-side-padding');
                    else content.classList.remove('no-side-padding');
                    void content.offsetWidth;
                    content.style.transition = hadTransition;
                }
            } catch (e) {}
        } else {
            if (content) {
                if (!s.showModalNavArrows) content.classList.add('no-side-padding');
                else content.classList.remove('no-side-padding');
            }
        }
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
