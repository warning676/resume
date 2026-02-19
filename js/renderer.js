class Renderer {
    constructor(state) {
        this.s = state;
    }

    fixImagePath(path) {
        if (!path) return path;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
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

                let thumbSrc = project.gallery?.[0] || '';
                const youtubeID = project.youtube;
                const hasValidYoutube = youtubeID && youtubeID.trim() !== "" && youtubeID !== "YOUTUBE_ID_HERE";
                if (hasValidYoutube) {
                    thumbSrc = `https://img.youtube.com/vi/${youtubeID}/maxresdefault.jpg`;
                } else {
                    thumbSrc = this.fixImagePath(thumbSrc);
                }

                const displayDate = project.date ? Utils.formatFullDate(project.date).toUpperCase() : "";
                const badgeHTML = project.badge ? `<span class="type-badge" style="margin-top: 10px; display: block;">${project.badge}</span>` : '';
                card.innerHTML = `
                    <div class="card-thumb">
                        <img src="${thumbSrc}" alt="${project.name}" onerror="if(this.src.includes('maxresdefault')){this.src='https://img.youtube.com/vi/${youtubeID}/hqdefault.jpg';}else{this.style.display='none';}">
                    </div>
                    <div class="card-content">
                        <h4>${(project.name || '')}</h4>
                        <p>${displayDate}</p>
                        ${badgeHTML}
                    </div>`;
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
        const isAchievementsPage = window.location.pathname.includes('achievements.html');

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
            item.innerHTML = `
                <img src="${this.fixImagePath(skill.icon)}" class="skill-icon">
                <span class="skill-meta">
                    <span class="skill-name">${skill.name}${certifiedBadge}</span>
                    <span class="type-badge">${skill.badge}</span>
                </span>
                <span class="level">${skill.level}</span>
                <span class="last-used">${skill.lastUsed}</span>`;

            item.addEventListener('click', () => s.openModalForItem(item));
            s.skillsList.appendChild(item);
        });

        s.updateTypeFilter(categories);
        if (!isAchievementsPage) s.sortSkills();
    }
}
