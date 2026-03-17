class ControlsManager {
    constructor(state) {
        this.s = state;
    }

    formatOptionLabel(value) {
        const text = String(value || '').trim();
        if (!text) return '';
        if (text === 'ALL' || text === 'ALL TOOLS' || text === 'ALL CATEGORIES') {
            return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        }
        return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    }

    ensureDropdownBestVisibility(container) {
        if (!container || !container.classList.contains('open')) return;

        const positionDropdown = (pass = 0) => {
            if (!container.classList.contains('open')) return;

            const dropdown = container.querySelector('.custom-select-dropdown, .multi-select-dropdown');
            const trigger = container.querySelector('.custom-select-trigger, .multi-select-trigger');
            if (!dropdown || !trigger) return;

            const viewportTop = 12;
            const viewportBottom = window.innerHeight - 12;
            const triggerRect = trigger.getBoundingClientRect();
            const gap = 5;
            let spaceBelow = Math.max(0, viewportBottom - triggerRect.bottom - gap);
            let spaceAbove = Math.max(0, triggerRect.top - viewportTop - gap);

            const previousMaxHeight = dropdown.style.maxHeight;
            const previousOverflowY = dropdown.style.overflowY;
            dropdown.style.maxHeight = 'none';
            dropdown.style.overflowY = 'hidden';
            const naturalHeight = Math.ceil(dropdown.scrollHeight);

            if (pass === 0 && naturalHeight > spaceBelow && triggerRect.top > viewportTop) {
                const desiredTop = viewportTop + gap;
                const scrollDelta = triggerRect.top - desiredTop;
                if (scrollDelta > 0) {
                    window.scrollBy({ top: scrollDelta, behavior: 'auto' });
                    requestAnimationFrame(() => positionDropdown(1));
                    return;
                }
            }

            if (pass > 0) {
                const refreshedTriggerRect = trigger.getBoundingClientRect();
                spaceBelow = Math.max(0, viewportBottom - refreshedTriggerRect.bottom - gap);
                spaceAbove = Math.max(0, refreshedTriggerRect.top - viewportTop - gap);
            }

            const fitsBelow = naturalHeight <= spaceBelow;
            const fitsAbove = naturalHeight <= spaceAbove;
            const openUpward = !fitsBelow && (fitsAbove || spaceAbove > spaceBelow);
            const availableSpace = openUpward ? spaceAbove : spaceBelow;
            const resolvedMaxHeight = Math.max(0, Math.min(naturalHeight, availableSpace));

            dropdown.style.top = openUpward ? 'auto' : '100%';
            dropdown.style.bottom = openUpward ? '100%' : 'auto';
            dropdown.style.marginTop = openUpward ? '0' : '5px';
            dropdown.style.marginBottom = openUpward ? '5px' : '0';
            dropdown.style.maxHeight = resolvedMaxHeight > 0 ? `${resolvedMaxHeight}px` : previousMaxHeight;
            dropdown.style.overflowY = naturalHeight > availableSpace ? 'auto' : 'hidden';

            if (resolvedMaxHeight <= 0) {
                dropdown.style.maxHeight = previousMaxHeight;
                dropdown.style.overflowY = previousOverflowY;
                return;
            }

            const dropdownRect = dropdown.getBoundingClientRect();
            let delta = 0;

            if (dropdownRect.bottom > viewportBottom) {
                delta = dropdownRect.bottom - viewportBottom;
            }

            if (triggerRect.top - delta < viewportTop) {
                delta = triggerRect.top - viewportTop;
            }

            if (delta !== 0 && pass === 0) {
                window.scrollBy({ top: delta, behavior: 'auto' });
                requestAnimationFrame(() => positionDropdown(1));
            }
        };

        requestAnimationFrame(() => positionDropdown());
    }

    syncDropdownScrollLock() {
        if (typeof window !== 'undefined' && typeof window.syncDropdownScrollLock === 'function') {
            window.syncDropdownScrollLock();
        }
    }

    initControlSkeletons() {
        const s = this.s;
        if (s.searchContainer) s.searchContainer.innerHTML = '<div class="skeleton-element" style="height: 36px; border-radius: 10px;"></div>';
        if (s.sortSelectContainer) s.sortSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 36px; width: 150px; border-radius: 10px;"></div>';
        if (s.orderSelectContainer) s.orderSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 36px; width: 164px; border-radius: 10px;"></div>';
        if (s.typeSelectContainer) s.typeSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 36px; width: 152px; border-radius: 10px;"></div>';
        if (s.toolSelectContainer) s.toolSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 36px; width: 152px; border-radius: 10px;"></div>';
    }

    renderStaticControls() {
        const s = this.s;
        const placeholder = s.isSkillsPage ? 'Search skills...' : 'Search projects...';
        this.renderSearchBox(s.searchContainer, s.searchQuery, placeholder, (val) => {
            s.searchQuery = val;
            if (s.isSkillsPage) s.filterSkills();
            else s.filterCards();
        });

        const sortOptions = s.isSkillsPage
            ? [{ id: 'name', label: 'Name' }, { id: 'proficiency', label: 'Proficiency' }, { id: 'lastUsed', label: 'Last Used' }]
            : [{ id: 'date', label: 'Date' }, { id: 'name', label: 'Name' }];

        this.renderSingleSelect(s.sortSelectContainer, sortOptions, s.selectedSort, (val) => {
            s.selectedSort = val;
            if (s.isSkillsPage) s.sortSkills();
            else s.sortCards();
        });

        let orderOptions = [
            { id: 'asc', label: 'Ascending' },
            { id: 'desc', label: 'Descending' }
        ];

        orderOptions.sort((a, b) => a.label.localeCompare(b.label));

        this.renderSingleSelect(s.orderSelectContainer, orderOptions, s.selectedOrder, (val) => {
            s.selectedOrder = val;
            if (s.isSkillsPage) s.sortSkills();
            else s.sortCards();
        });
    }

    updateTypeFilter(categories) {
        const s = this.s;
        if (!s.typeSelectContainer) return;
        const sortedCategories = Array.from(categories.entries()).sort((a, b) => a[1].localeCompare(b[1]));
        const options = sortedCategories.map(([id, label]) => ({ id, label }));

        if (options.length > 1 && !options.find(o => o.id === 'all')) {
            options.unshift({ id: 'all', label: 'All Categories' });
        }
        if (s.selectedCategories.includes('all') && !options.find(o => o.id === 'all') && options.length > 0) {
            s.selectedCategories = [options[0].id];
        }

        this.renderMultiSelect(s.typeSelectContainer, options, s.selectedCategories, (newSelected) => {
            s.selectedCategories = newSelected;
            if (s.isSkillsPage) s.filterSkills();
            else s.filterCards();
        });
    }

    updateToolFilter(toolsMap) {
        const s = this.s;
        if (!s.toolSelectContainer) return;
        const sortedTools = Array.from(toolsMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
        const options = sortedTools.map(([id, label]) => ({ id, label }));

        if (options.length > 1 && !options.find(o => o.id === 'all')) {
            options.unshift({ id: 'all', label: 'All Tools' });
        }
        if (s.selectedTools.includes('all') && !options.find(o => o.id === 'all') && options.length > 0) {
            s.selectedTools = [options[0].id];
        }

        this.renderMultiSelect(s.toolSelectContainer, options, s.selectedTools, (newSelected) => {
            s.selectedTools = newSelected;
            s.filterCards();
        });
    }

    renderMultiSelect(container, options, selectedValues, onChange) {
        const wasOpen = container.classList.contains('open');
        container.classList.remove('open');
        container.classList.add('skip-animation');
        container.innerHTML = '';
        if (!container.classList.contains('multi-select-container')) {
            container.classList.add('multi-select-container');
        }

        const hasAllOption = options.some(o => o.id === 'all');
        const individualIds = options.filter(o => o.id !== 'all').map(o => o.id);
        const isAllMode = selectedValues.includes('all');

        const trigger = document.createElement('div');
        trigger.className = 'multi-select-trigger';

        if (isAllMode) {
            trigger.textContent = options.find(o => o.id === 'all')?.label || 'All';
        } else if (selectedValues.length === 0) {
            trigger.textContent = 'None Selected';
        } else if (selectedValues.length === 1) {
            const found = options.find(o => o.id === selectedValues[0]);
            trigger.textContent = found ? this.formatOptionLabel(found.label) : this.formatOptionLabel(selectedValues[0]);
        } else {
            trigger.textContent = `${selectedValues.length} Selected`;
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'multi-select-dropdown';

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'multi-select-item';

            const checked = (opt.id === 'all') ? isAllMode : (isAllMode || selectedValues.includes(opt.id));
            if (checked) item.classList.add('selected');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = checked;

            const label = document.createElement('span');
            label.className = 'multi-select-item-label';
            label.textContent = this.formatOptionLabel(opt.label);

            item.appendChild(checkbox);
            item.appendChild(label);

            item.addEventListener('click', (e) => {
                e.stopPropagation();

                if (opt.id === 'all') {
                    selectedValues.length = 0;
                    selectedValues.push('all');
                } else {
                    if (isAllMode) {
                        selectedValues.length = 0;
                        selectedValues.push(opt.id);
                    } else if (selectedValues.includes(opt.id)) {
                        selectedValues.splice(selectedValues.indexOf(opt.id), 1);
                    } else {
                        selectedValues.push(opt.id);
                    }
                    if (selectedValues.length === 0) {
                        selectedValues.push('all');
                    } else if (hasAllOption && individualIds.every(id => selectedValues.includes(id))) {
                        selectedValues.length = 0;
                        selectedValues.push('all');
                    }
                }

                this.renderMultiSelect(container, options, selectedValues, onChange);
                onChange(selectedValues);
            });

            dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.closeAllColumnFilterMenus === 'function') {
                window.closeAllColumnFilterMenus();
            }
            document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => {
                if (c !== container) c.classList.remove('open');
            });
            container.classList.remove('skip-animation');
            container.classList.toggle('open');
            this.ensureDropdownBestVisibility(container);
            this.syncDropdownScrollLock();
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);
        
        if (wasOpen) {
            container.classList.add('open');
            this.ensureDropdownBestVisibility(container);
        }
    }

    renderSingleSelect(container, options, initialValue, onChange) {
        if (!container) return;
        if (container._rebuildTimer) {
            clearTimeout(container._rebuildTimer);
            delete container._rebuildTimer;
        }
        const wasOpen = container.classList.contains('open');
        container.innerHTML = '';
        container.className = 'custom-select-container' + (wasOpen ? ' open' : '');

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        const activeOpt = options.find(o => o.id === initialValue);
        trigger.textContent = activeOpt ? activeOpt.label : initialValue;

        const dropdown = document.createElement('div');
        dropdown.className = 'custom-select-dropdown';

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'custom-select-item';
            if (opt.id === initialValue) item.classList.add('selected');
            item.textContent = opt.label;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLabel = opt.label;
                const selectedId = opt.id;
                container.classList.remove('open');
                this.syncDropdownScrollLock();
                onChange(selectedId);
                const triggerEl = container.querySelector('.custom-select-trigger');
                if (triggerEl) triggerEl.textContent = selectedLabel;
                if (container._rebuildTimer) clearTimeout(container._rebuildTimer);
                container._rebuildTimer = setTimeout(() => {
                    delete container._rebuildTimer;
                    this.renderSingleSelect(container, options, selectedId, onChange);
                }, 260);
            });
            dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof window.closeAllColumnFilterMenus === 'function') {
                window.closeAllColumnFilterMenus();
            }
            const isOpen = container.classList.contains('open');
            document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
            if (!isOpen) container.classList.add('open');
            this.ensureDropdownBestVisibility(container);
            this.syncDropdownScrollLock();
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);
    }

    renderSearchBox(container, initialValue, placeholder, onInput) {
        if (!container) return;
        const s = this.s;
        container.innerHTML = '';
        const searchWrap = document.createElement('div');
        searchWrap.className = 'search-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'portfolio-search';
        input.className = 'custom-input';
        input.placeholder = placeholder || 'Search...';
        input.value = initialValue;
        input.autocomplete = 'off';

        let searchTimeout;
        input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                onInput(e.target.value);
            }, 150);
        });

        searchWrap.appendChild(input);
        container.appendChild(searchWrap);
        s.searchInput = input;
    }
}
