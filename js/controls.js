class ControlsManager {
    constructor(state) {
        this.s = state;
    }

    initControlSkeletons() {
        const s = this.s;
        if (s.searchContainer) s.searchContainer.innerHTML = '<div class="skeleton-element" style="height: 34px; border-radius: 6px;"></div>';
        if (s.sortSelectContainer) s.sortSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 34px; border-radius: 6px;"></div>';
        if (s.orderSelectContainer) s.orderSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 34px; border-radius: 6px;"></div>';
        if (s.typeSelectContainer) s.typeSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 34px; border-radius: 6px; width: 140px;"></div>';
        if (s.toolSelectContainer) s.toolSelectContainer.innerHTML = '<div class="skeleton-element" style="height: 34px; border-radius: 6px; width: 140px;"></div>';
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

        const orderOptions = [{ id: 'desc', label: 'Descending' }, { id: 'asc', label: 'Ascending' }];
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
        container.innerHTML = '';
        container.className = 'multi-select-container' + (wasOpen ? ' open' : '');

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
            trigger.textContent = found ? found.label : selectedValues[0];
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
            label.textContent = opt.label;

            item.appendChild(checkbox);
            item.appendChild(label);

            item.addEventListener('click', (e) => {
                e.stopPropagation();

                if (opt.id === 'all') {
                    if (isAllMode) {
                        selectedValues.length = 0;
                    } else {
                        selectedValues.length = 0;
                        selectedValues.push('all');
                    }
                } else {
                    if (isAllMode) {
                        selectedValues.length = 0;
                        individualIds.forEach(id => { if (id !== opt.id) selectedValues.push(id); });
                    } else if (selectedValues.includes(opt.id)) {
                        selectedValues.splice(selectedValues.indexOf(opt.id), 1);
                    } else {
                        selectedValues.push(opt.id);
                    }
                    if (hasAllOption && individualIds.every(id => selectedValues.includes(id))) {
                        selectedValues.length = 0;
                        selectedValues.push('all');
                    }
                }

                // Allow empty selection: do not force 'all' when nothing selected.

                this.renderMultiSelect(container, options, selectedValues, onChange);
                onChange(selectedValues);
            });

            dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => {
                if (c !== container) c.classList.remove('open');
            });
            container.classList.toggle('open');
        });

        container.appendChild(trigger);
        container.appendChild(dropdown);
    }

    renderSingleSelect(container, options, initialValue, onChange) {
        if (!container) return;
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
                container.classList.remove('open');
                onChange(opt.id);
                this.renderSingleSelect(container, options, opt.id, onChange);
            });
            dropdown.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = container.classList.contains('open');
            document.querySelectorAll('.custom-select-container, .multi-select-container').forEach(c => c.classList.remove('open'));
            if (!isOpen) container.classList.add('open');
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

        input.addEventListener('input', (e) => {
            onInput(e.target.value);
        });

        searchWrap.appendChild(input);
        container.appendChild(searchWrap);
        s.searchInput = input;
    }
}
