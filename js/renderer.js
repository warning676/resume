class Renderer {
    constructor(state) {
        this.s = state;
    }

    fixImagePath(path) {
        if (!path) return path;
        if (path.startsWith('http') || path.startsWith('data:')) {
            if (path.includes('drive.google.com')) {
                if (!path.includes('lh3.google.com')) {
                    const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (fileIdMatch) {
                        return `https://lh3.google.com/d/${fileIdMatch[1]}=w1200`;
                    }
                }
            }
            return path;
        }
        if (path.startsWith('../')) return path;
        return '../' + path;
    }

    showSkeletons(container, count) {
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
                        <div class="skeleton-element" style="width: 55%; height: 12px; margin-top: 10px; border-radius: 4px;"></div>
                    </div>
                </div>`;
        }
        for (let i = 0; i < count; i++) {
            container.insertAdjacentHTML('beforeend', skeletonContent);
        }
    }

    renderProjects(projects) {
        const s = this.s;
        if (!s.portfolioGrid || !projects) return;
        s.portfolioGrid.innerHTML = '';

        projects.forEach(project => {
            try {
                const card = document.createElement('div');
                card.className = 'portfolio-card';
                card.setAttribute('data-name', project.name || '');
                card.setAttribute('data-date', project.date || '');
                card.setAttribute('data-info', project.info || '');
                card.setAttribute('data-tools', project.tools || '');
                card.setAttribute('data-youtube', project.youtube || '');
                card.setAttribute('data-type', project.badge || '');
                card.setAttribute('data-badge', project.badge || '');
                card.setAttribute('data-gallery', project.gallery ? project.gallery.join(', ') : '');

                let thumbSrc = project.resolvedThumb || project.gallery?.[0] || '';
                const youtubeID = Utils.extractYouTubeID(project.youtube || '');
                const hasValidYoutube = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";
                if (hasValidYoutube) {
                    thumbSrc = project.resolvedThumb || `https://img.youtube.com/vi/${youtubeID}/maxresdefault.jpg`;
                } else {
                    thumbSrc = project.resolvedThumb || this.fixImagePath(thumbSrc);
                }

                const displayDate = project.date ? Utils.formatFullDate(project.date).toUpperCase() : "";
                const badgeHTML = project.badge ? `<span class="type-badge" style="margin-top: 10px; display: block;">${project.badge}</span>` : '';
                
                const isVideosPage = s.currentRoute === '/videos';
                const awards = isVideosPage && s.filmFestivalAwards ? s.filmFestivalAwards[project.name] : null;
                let awardsHTML = '';
                let awardsSearchData = '';
                if (awards && awards.length > 0) {
                    const awardsList = awards.map(a => `${a.award} - ${a.location}`).join('\n');
                    awardsSearchData = awards.map(a => `${a.award} ${a.location}`).join(' ');
                    awardsHTML = `<span class="awards-badge" title="${awardsList}">WON AWARDS</span>`;
                } else {
                    awardsHTML = '';
                }
                card.setAttribute('data-awards', awardsSearchData);
                
                card.innerHTML = `
                    <div class="card-thumb">
                        <img src="${thumbSrc}" alt="${project.name}">
                    </div>
                    <div class="card-content">
                        <h4>${(project.name || '')}</h4>
                        <p>${displayDate}</p>
                        ${badgeHTML}
                        ${awardsHTML}
                    </div>`;
                
                const imgElement = card.querySelector('img');
                if (imgElement && hasValidYoutube) {
                    imgElement.onload = function() {
                        if (this.naturalWidth === 120 && this.naturalHeight === 90) {
                            this.style.opacity = '0.3';
                            this.style.filter = 'blur(2px)';
                        }
                    };
                    imgElement.onerror = function() {
                        this.style.opacity = '0.3';
                    };
                }
                
                card.addEventListener('click', () => s.openModalForItem(card));
                s.portfolioGrid.appendChild(card);
            } catch (err) {
                console.error("Error individual card:", project.name, err);
            }
        });

        const categories = new Map();
        const toolsMap = new Map();
        projects.forEach(project => {
            if (project.badge) categories.set(project.badge, project.badge);
            if (project.tools) {
                project.tools.split(',').forEach(tool => {
                    const trimmed = tool.trim();
                    if (trimmed) toolsMap.set(trimmed, trimmed);
                });
            }
        });
        s.updateTypeFilter(categories);
        s.updateToolFilter(toolsMap);
        s.sortCards();
    }

    renderSkills(skills) {
        const s = this.s;
        if (!s.skillsList || !skills) return;
        const isAchievementsPage = !!s.isAchievementsPage;

        s.skillsList.innerHTML = '<div class="grid-structure grid-header"><span>Skill</span><span>Proficiency</span><span>Last Used</span></div>';

        const categories = new Map();

        skills.forEach(skill => {
            if (isAchievementsPage && !skill.certified) return;
            if (skill.badge) categories.set(skill.badge, skill.badge);

            const item = document.createElement('div');
            item.className = 'grid-structure skill-item';
            item.setAttribute('data-type', skill.badge || '');
            item.setAttribute('data-name', skill.name);
            item.setAttribute('data-info', skill.info || '');
            item.setAttribute('data-certified', skill.certified ? "true" : "false");
            item.setAttribute('data-cert-name', skill.certName || "");
            item.setAttribute('data-badge', skill.badge || "");

            const certifiedBadge = skill.certified ? `<span class="grid-certified-badge" title="${skill.certName ? skill.certName : skill.name}">CERTIFIED</span>` : '';
            const iconSrc = skill.resolvedIcon || this.fixImagePath(skill.icon);
            item.innerHTML = `
                <span class="skill-icon-wrap">
                    <span class="skill-icon-skeleton skeleton-element"></span>
                    <img src="${iconSrc}" class="skill-icon" onerror="console.warn('Failed to load icon:', this.src); this.style.opacity='0.5';">
                </span>
                <span class="skill-meta">
                    <span class="skill-name">${skill.name}${certifiedBadge}</span>
                    <span class="type-badge">${skill.badge}</span>
                </span>
                <span class="level">${skill.level}</span>
                <span class="last-used">${skill.lastUsed}</span>`;

            const iconImg = item.querySelector('.skill-icon');
            const iconSkeleton = item.querySelector('.skill-icon-skeleton');
            if (iconImg && iconSkeleton) {
                const clearSkeleton = () => {
                    if (iconSkeleton.parentElement) iconSkeleton.remove();
                };
                iconImg.onload = clearSkeleton;
                iconImg.onerror = clearSkeleton;
                if (iconImg.complete) clearSkeleton();
            }

            item.addEventListener('click', () => s.openModalForItem(item));
            s.skillsList.appendChild(item);
        });

        s.updateTypeFilter(categories);
        if (!isAchievementsPage) s.sortSkills();
    }
}
