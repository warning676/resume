class Renderer {
    constructor(state) {
        this.s = state;
    }

    fitTableColumns(table, shell, options = {}) {
        if (!table || !shell) return;
        const theadRow = table.tHead && table.tHead.rows[0] ? table.tHead.rows[0] : null;
        const tbody = table.tBodies && table.tBodies[0] ? table.tBodies[0] : null;
        if (!theadRow || !tbody) return;

        const ths = Array.from(theadRow.cells || []);
        const colCount = ths.length;
        if (!colCount) return;

        const available = Math.max(0, Math.floor(shell.clientWidth) - 2);
        if (!available) return;

        const buffer = Number.isFinite(options.buffer) ? options.buffer : 12;
        const floorMin = Number.isFinite(options.floorMin) ? options.floorMin : 110;
        const priorityColumnIndexes = Array.isArray(options.priorityColumnIndexes) ? options.priorityColumnIndexes : null;
        const prioritySet = priorityColumnIndexes ? new Set(priorityColumnIndexes.filter(n => Number.isInteger(n) && n >= 0 && n < colCount)) : new Set();
        const nonPriorityFloorMin = Number.isFinite(options.nonPriorityFloorMin)
            ? options.nonPriorityFloorMin
            : Math.max(40, Math.floor(floorMin * 0.7));

        const measureWrap = document.createElement('div');
        measureWrap.style.position = 'absolute';
        measureWrap.style.left = '-10000px';
        measureWrap.style.top = '0';
        measureWrap.style.visibility = 'hidden';
        measureWrap.style.pointerEvents = 'none';
        measureWrap.style.width = 'max-content';

        const clone = table.cloneNode(true);
        clone.style.tableLayout = 'auto';
        clone.style.width = 'max-content';
        clone.style.minWidth = '0';
        clone.querySelectorAll('colgroup').forEach(cg => cg.remove());
        clone.querySelectorAll('th, td').forEach(cell => {
            cell.style.width = '';
            cell.style.maxWidth = '';
            cell.style.whiteSpace = 'nowrap';
            cell.style.overflow = 'visible';
            cell.style.textOverflow = 'clip';
        });

        measureWrap.appendChild(clone);
        document.body.appendChild(measureWrap);

        const cloneHeadRow = clone.tHead && clone.tHead.rows[0] ? clone.tHead.rows[0] : null;
        const cloneBody = clone.tBodies && clone.tBodies[0] ? clone.tBodies[0] : null;
        if (!cloneHeadRow || !cloneBody) {
            measureWrap.remove();
            return;
        }

        const cloneThs = Array.from(cloneHeadRow.cells || []);
        const cloneRows = Array.from(cloneBody.rows || []);

        const measureCell = (cell) => Math.ceil((cell && cell.getBoundingClientRect().width) || 0);
        const needed = new Array(colCount).fill(0);
        for (let i = 0; i < colCount; i++) needed[i] = Math.max(needed[i], measureCell(cloneThs[i]));
        cloneRows.forEach((row) => {
            const cells = Array.from(row.cells || []);
            for (let i = 0; i < Math.min(colCount, cells.length); i++) {
                needed[i] = Math.max(needed[i], measureCell(cells[i]));
            }
        });

        measureWrap.remove();

        for (let i = 0; i < colCount; i++) needed[i] += buffer;

        const headerMin = cloneThs.map(th => measureCell(th) + buffer);
        const floor = new Array(colCount).fill(0).map((_, i) => {
            const min = prioritySet.has(i) ? floorMin : nonPriorityFloorMin;
            return Math.max(min, headerMin[i] || 0);
        });

        const useTightAllocation = prioritySet.size > 0;
        let alloc;
        let deficit;
        let canNoWrap;

        if (useTightAllocation) {
            const sumFloor = floor.reduce((sum, v) => sum + v, 0);
            alloc = floor.slice();
            let remaining = Math.max(0, available - sumFloor);

            const deficits = alloc.map((w, i) => Math.max(0, needed[i] - w));
            deficit = deficits.slice();

            for (let guard = 0; guard < 2000; guard++) {
                if (remaining <= 0) break;
                const prCandidates = Array.from(prioritySet).filter(i => i >= 0 && i < colCount && deficit[i] > 0);
                const candidates = prCandidates.length
                    ? prCandidates
                    : deficit.map((d, i) => ({ i, d })).filter(x => x.d > 0).sort((a, b) => b.d - a.d).map(x => x.i);

                if (!candidates.length) break;
                let pick = candidates[0];
                if (candidates.length > 1) {
                    pick = candidates.reduce((best, cur) => (deficit[cur] > deficit[best] ? cur : best), candidates[0]);
                }

                const amount = Math.min(deficit[pick], remaining);
                if (amount <= 0) break;
                alloc[pick] += amount;
                deficit[pick] -= amount;
                remaining -= amount;
            }

            if (remaining > 0) {
                const prCols = Array.from(prioritySet);
                if (prCols.length) {
                    for (let k = 0; k < remaining; k++) {
                        alloc[prCols[k % prCols.length]] += 1;
                    }
                } else {
                    for (let k = 0; k < remaining; k++) {
                        alloc[k % colCount] += 1;
                    }
                }
            }

            canNoWrap = deficit.every(d => d <= 0);
        } else {
            const base = Math.floor(available / colCount);
            alloc = new Array(colCount).fill(base);
            let rem = available - (base * colCount);
            for (let i = 0; i < rem; i++) alloc[i % colCount] += 1;

            const calcSurplus = () => alloc.map((w, i) => Math.max(0, w - floor[i]));
            const calcDeficit = () => alloc.map((w, i) => Math.max(0, needed[i] - w));

            let surplus = calcSurplus();
            deficit = calcDeficit();

            for (let guard = 0; guard < 80; guard++) {
                const defPairs = deficit.map((d, i) => ({ i, d })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
                const surPairs = surplus.map((s, i) => ({ i, s })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
                if (!defPairs.length || !surPairs.length) break;
                const to = defPairs[0].i;
                const from = surPairs[0].i;
                const amount = Math.min(defPairs[0].d, surplus[from]);
                if (!amount) break;
                alloc[from] -= amount;
                alloc[to] += amount;
                surplus = calcSurplus();
                deficit = calcDeficit();
            }

            if (prioritySet.size) {
                const minAllowed = floor.map((f, i) => {
                    if (prioritySet.has(i)) return f;
                    const soft = Math.min(f, needed[i] || 0);
                    return Math.max(headerMin[i] || 0, soft);
                });

                for (let guard = 0; guard < 120; guard++) {
                    let moved = false;
                    for (const p of prioritySet) {
                        if (p < 0 || p >= colCount) continue;
                        if (alloc[p] >= needed[p]) continue;

                        const need = needed[p] - alloc[p];
                        let donor = -1;
                        let bestSurplus = 0;

                        for (let d = 0; d < colCount; d++) {
                            if (d === p) continue;
                            const surplusAmt = alloc[d] - (minAllowed[d] || 0);
                            if (surplusAmt > bestSurplus) {
                                bestSurplus = surplusAmt;
                                donor = d;
                            }
                        }

                        if (donor === -1 || bestSurplus <= 0) continue;
                        const amount = Math.min(need, bestSurplus);
                        if (!amount) continue;

                        alloc[donor] -= amount;
                        alloc[p] += amount;
                        moved = true;
                    }
                    if (!moved) break;
                }

                deficit = alloc.map((w, i) => Math.max(0, needed[i] - w));
            }

            canNoWrap = deficit.every(d => d <= 0);
        }

        let colgroup = table.querySelector('colgroup');
        if (!colgroup) {
            colgroup = document.createElement('colgroup');
            table.insertBefore(colgroup, table.firstChild);
        }
        colgroup.innerHTML = '';
        alloc.forEach((w) => {
            const col = document.createElement('col');
            col.style.width = `${Math.max(0, Math.floor(w))}px`;
            colgroup.appendChild(col);
        });

        const totalFloor = floor.reduce((sum, f) => sum + f, 0);

        table.classList.add('table-fit');
        if (canNoWrap) table.classList.add('table-fit-nowrap');
        else table.classList.remove('table-fit-nowrap');

        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
        table.style.minWidth = Math.max(available, totalFloor) + 'px';
    }

    ensureSkillsFitBinding() {
        const s = this.s;
        if (!s) return;
        if (s._skillsFitBound) return;
        s._skillsFitBound = true;
        let t = null;
        window.addEventListener('resize', () => {
            if (t) clearTimeout(t);
            t = setTimeout(() => {
                const skillsShell = document.querySelector('.courses-table-shell.skills-table-shell');
                const skillsTable = document.querySelector('table.skills-table');
                if (skillsShell && skillsTable) this.fitTableColumns(skillsTable, skillsShell, { floorMin: 90, nonPriorityFloorMin: 65, priorityColumnIndexes: [0, 1] });
                const coursesShell = document.querySelector('#courses-table')?.closest('.courses-table-shell');
                const coursesTable = document.querySelector('#courses-table');
                if (coursesShell && coursesTable) this.fitTableColumns(coursesTable, coursesShell, { floorMin: 90, nonPriorityFloorMin: 65, priorityColumnIndexes: [1, 2] });
            }, 120);
        }, { passive: true });
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
            container.innerHTML = `<div class="courses-table-shell skills-table-shell"><table class="courses-table skills-table"><thead><tr><th>Skill</th><th>Category</th><th>Proficiency</th><th>Last Used</th></tr></thead><tbody class="skills-table-body">${rows}</tbody></table></div>`;
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
                            <div class="skeleton-element" style="width: 78%; height: 18px; margin-bottom: 10px; border-radius: 999px;"></div>
                            <div class="skeleton-element" style="width: 42%; height: 14px; border-radius: 999px;"></div>
                            <div class="skeleton-element" style="width: 56%; height: 12px; margin-top: 12px; border-radius: 999px;"></div>
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
                        <img src="${thumbSrc}" alt="${project.name}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <div class="card-info">
                            <h3>${(project.name || '')}</h3>
                            <p>${displayDate}</p>
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
                            <th class="table-sort-header" data-sort-scope="skills" data-sort-key="name" tabindex="0" role="button" aria-label="Sort Skill"><span class="table-header-chip"><span class="table-header-label">Skill</span><span class="table-header-actions" aria-hidden="true"><span class="table-sort-button" data-sort-order="asc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m18 15-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><span class="table-sort-button" data-sort-order="desc"><svg viewBox="0 0 24 24" width="14" height="14" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span></span></th>
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
                <td data-label="Skill">
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

        this.ensureSkillsFitBinding();
        requestAnimationFrame(() => {
            setTimeout(() => {
                const shell = s.skillsList.querySelector('.courses-table-shell.skills-table-shell') || s.skillsList.querySelector('.courses-table-shell');
                const table = s.skillsList.querySelector('table.skills-table');
                if (shell && table) this.fitTableColumns(table, shell, { floorMin: 90, nonPriorityFloorMin: 65, priorityColumnIndexes: [0, 1] });
            }, 0);
        });
    }
}
