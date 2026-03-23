class Renderer {
    constructor(state) {
        this.s = state;
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

    showSkeletons(container, count) {
        if (!container) return;
        const isPortfolioGrid = container.id === 'portfolio-grid';
        const isSkillsGrid = container.id === 'skills-list';

        container.style.visibility = 'visible';
        container.style.display = isPortfolioGrid ? 'grid' : 'block';

        if (isSkillsGrid) {
            const rowWidths = [
                [126, 96, 94, 82],
                [142, 112, 102, 76],
                [118, 88, 90, 84],
                [134, 104, 98, 78],
            ];
            let rows = '';
            for (let i = 0; i < count; i++) {
                const w = rowWidths[i % rowWidths.length];
                rows += `<tr class="courses-skeleton-row">
                    <td><div style="display:flex;align-items:center;gap:10px;"><div class="skeleton-element" style="width:28px;height:28px;border-radius:4px;flex-shrink:0;"></div><div style="min-width:0;"><div class="skeleton-element" style="width:${w[0]}px;max-width:100%;height:14px;border-radius:999px;"></div></div></div></td>
                    <td><div class="skeleton-element" style="width:${w[1]}px;height:14px;border-radius:999px;"></div></td>
                    <td><div class="skeleton-element" style="width:${w[2]}px;height:18px;border-radius:999px;"></div></td>
                    <td><div class="skeleton-element" style="width:${w[3]}px;height:14px;border-radius:999px;"></div></td>
                </tr>`;
            }
            container.innerHTML = `<div class="courses-table-shell skills-table-shell"><table class="courses-table skills-table"><thead><tr><th>Name</th><th>Category</th><th>Proficiency</th><th>Last Used</th></tr></thead><tbody class="skills-table-body">${rows}</tbody></table></div>`;
            return;
        }

        container.innerHTML = '';

        let skeletonContent = '';
        if (isPortfolioGrid) {
            skeletonContent = `
                <div class="portfolio-card skeleton-item">
                    <div class="card-thumb"><div class="skeleton-element" style="width: 100%; height: 100%;"></div></div>
                    <div class="card-content">
                        <div class="card-info">
                            <div class="skeleton-element" style="width: 38%; height: 11px; margin-bottom: 8px; border-radius: 999px;"></div>
                            <div class="skeleton-element" style="width: 78%; height: 18px; margin-bottom: 10px; border-radius: 999px;"></div>
                            <div class="skeleton-element" style="width: 42%; height: 14px; border-radius: 999px;"></div>
                        </div>
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
                    thumbSrc = project.resolvedThumb || `https://i.ytimg.com/vi/${youtubeID}/hqdefault.jpg`;
                } else {
                    thumbSrc = project.resolvedThumb || this.fixImagePath(thumbSrc);
                }

                const displayDate = project.date ? Utils.formatFullDate(project.date).toUpperCase() : '';
                const dateHTML = displayDate ? `<p class="card-meta-date">${displayDate}</p>` : '';
                const badgeHTML = project.badge ? `<span class="type-badge">${project.badge}</span>` : '';
                
                const isVideosPage = s.currentRoute === '/videos';
                const awards = isVideosPage && s.filmFestivalAwards ? s.filmFestivalAwards[project.name] : null;
                let awardsHTML = '';
                let awardsSearchData = '';
                if (awards && awards.length > 0) {
                    const escAttr = (v) => String(v ?? '')
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/</g, '&lt;');
                    const awardsList = awards.map(a => `${a.award} - ${a.location}`).join('\n');
                    awardsSearchData = awards.map(a => `${a.award} ${a.location}`).join(' ');
                    awardsHTML = `<div class="card-awards-stack"><span class="card-awards-row" title="${escAttr(awardsList)}"><span class="card-awards-icon" aria-hidden="true">${Utils.lucideTrophySvg({ size: 18, className: 'lucide lucide-trophy' })}</span><span class="card-awards-label">Won awards</span></span></div>`;
                } else {
                    awardsHTML = '';
                }
                card.setAttribute('data-awards', awardsSearchData);
                
                card.innerHTML = `
                    <div class="card-thumb">
                        <img src="${thumbSrc}" alt="${project.name}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <div class="card-info">
                            ${dateHTML}
                            <h3>${(project.name || '')}</h3>
                            ${badgeHTML}
                        </div>
                        ${awardsHTML ? `<div class="card-awards">${awardsHTML}</div>` : ''}
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
        if (s.filterCards) s.filterCards();
    }

    renderSkills(skills) {
        const s = this.s;
        if (!s.skillsList || !skills) return;
        const isAchievementsPage = !!s.isAchievementsPage;

        s.skillsList.innerHTML = `
            <div class="courses-table-shell skills-table-shell">
                <table class="courses-table skills-table">
                    <thead>
                        <tr>
                            <th class="table-sort-header" data-sort-scope="skills" data-sort-key="name" tabindex="0" role="button" aria-label="Sort Name"><span class="table-header-chip"><span class="table-header-label">Name</span><span class="table-header-actions" aria-hidden="true"><span class="table-sort-button" data-sort-order="asc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m18 15-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><span class="table-sort-button" data-sort-order="desc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span></span></th>
                            <th class="table-sort-header" data-sort-scope="skills" data-sort-key="type" tabindex="0" role="button" aria-label="Sort Category"><span class="table-header-chip"><span class="table-header-meta"><span class="table-header-label">Category</span><span class="column-header-filter-indicator" data-filter-scope="skills" data-filter-key="type" aria-hidden="true"></span></span><span class="table-header-actions" aria-hidden="true"><span class="table-sort-button" data-sort-order="asc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m18 15-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><span class="table-sort-button" data-sort-order="desc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span></span></th>
                            <th class="table-sort-header" data-sort-scope="skills" data-sort-key="proficiency" tabindex="0" role="button" aria-label="Sort Proficiency"><span class="table-header-chip"><span class="table-header-meta"><span class="table-header-label">Proficiency</span><span class="column-header-filter-indicator" data-filter-scope="skills" data-filter-key="level" aria-hidden="true"></span></span><span class="table-header-actions" aria-hidden="true"><span class="table-sort-button" data-sort-order="asc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m18 15-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><span class="table-sort-button" data-sort-order="desc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span></span></th>
                            <th class="table-sort-header" data-sort-scope="skills" data-sort-key="lastUsed" tabindex="0" role="button" aria-label="Sort Last Used"><span class="table-header-chip"><span class="table-header-label">Last Used</span><span class="table-header-actions" aria-hidden="true"><span class="table-sort-button" data-sort-order="asc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m18 15-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><span class="table-sort-button" data-sort-order="desc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span></span></th>
                        </tr>
                    </thead>
                    <tbody class="skills-table-body"></tbody>
                </table>
            </div>`;

        const tableBody = s.skillsList.querySelector('.skills-table-body');
        const categories = new Map();

        skills.forEach((skill, index) => {
            if (isAchievementsPage && !skill.certified) return;
            if (skill.badge) categories.set(skill.badge, skill.badge);
            const normalizedLevel = (skill.level || '').toLowerCase().trim();
            const levelBadgeClass = normalizedLevel === 'beginner'
                ? 'proficiency-beginner'
                : normalizedLevel === 'intermediate'
                    ? 'proficiency-intermediate'
                    : normalizedLevel === 'advanced'
                        ? 'proficiency-advanced'
                        : 'proficiency-unknown';

            const item = document.createElement('tr');
            item.className = 'skill-item';
            item.setAttribute('data-type', skill.badge || '');
            item.setAttribute('data-name', skill.name || '');
            item.setAttribute('data-info', skill.info || '');
            item.setAttribute('data-certified', skill.certified ? 'true' : 'false');
            item.setAttribute('data-cert-name', skill.certName || skill.name || '');
            item.setAttribute('data-badge', skill.badge || '');
            item.setAttribute('data-original-index', String(index));

            const certifiedBadge = skill.certified ? `<span class="grid-certified-badge" title="${skill.certName || skill.name}">CERTIFIED</span>` : '';
            const iconSrc = skill.resolvedIcon || this.fixImagePath(skill.icon);

            item.innerHTML = `
                <td data-label="Name">
                    <div class="skill-name-cell">
                        <span class="skill-icon-wrap">
                            <span class="skill-icon-skeleton skeleton-element"></span>
                            <img src="${iconSrc}" class="skill-icon" alt="${skill.name} icon" loading="lazy" onerror="this.style.opacity='0.5';">
                        </span>
                        <span class="skill-meta">
                            <span class="skill-name"><span class="skill-name-text">${skill.name || '-'}</span>${certifiedBadge}</span>
                        </span>
                    </div>
                </td>
                <td data-label="Category"><span class="type-badge">${skill.badge || '-'}</span></td>
                <td data-label="Proficiency"><span class="level proficiency-badge ${levelBadgeClass}">${skill.level || '-'}</span></td>
                <td data-label="Last Used"><span class="last-used">${skill.lastUsed || '-'}</span></td>`;

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

            const primeSkillModalIcon = () => {
                if (!s.modalManager) return;
                s.modalManager.preloadSkillIconForItem(item, 'skill');
                s.modalManager.preloadAdjacentSkillIconsFromDom(s.skillsList, '.skill-item', item);
            };
            item.addEventListener('pointerenter', primeSkillModalIcon);
            item.addEventListener('pointerdown', primeSkillModalIcon);
            item.addEventListener('touchstart', primeSkillModalIcon, { passive: true });
            item.addEventListener('click', () => s.openModalForItem(item));
            tableBody.appendChild(item);
        });

        s.updateTypeFilter(categories);
        s.sortSkills();
        if (typeof s.syncSkillSortIndicators === 'function') s.syncSkillSortIndicators();

    }
}
