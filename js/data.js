const SHEET_CACHE_TTL_MS = 1000 * 60 * 15;

class DataService {
    constructor(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
        this.connectionSamples = [];
        this.lastConnectionState = null;
    }

    recordConnectionSample(durationMs, fromCache = false, hadError = false) {
        const sample = {
            durationMs: Number.isFinite(durationMs) ? durationMs : null,
            fromCache,
            hadError,
            at: Date.now()
        };
        this.lastConnectionState = sample;
        if (Number.isFinite(sample.durationMs)) {
            this.connectionSamples.push(sample.durationMs);
            if (this.connectionSamples.length > 8) {
                this.connectionSamples.shift();
            }
        }
    }

    getAverageConnectionMs() {
        if (!this.connectionSamples.length) return null;
        const total = this.connectionSamples.reduce((sum, v) => sum + v, 0);
        return total / this.connectionSamples.length;
    }

    resolveConnectionQuality() {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return { label: 'Offline', key: 'offline' };
        }

        if (this.lastConnectionState && this.lastConnectionState.fromCache && this.lastConnectionState.hadError) {
            return { label: 'Poor', key: 'poor' };
        }

        const avgMs = this.getAverageConnectionMs();
        if (Number.isFinite(avgMs)) {
            if (avgMs <= 1200) return { label: 'Good', key: 'good' };
            return { label: 'Poor', key: 'poor' };
        }

        const connection = typeof navigator !== 'undefined' ? navigator.connection || navigator.mozConnection || navigator.webkitConnection : null;
        const type = connection && connection.effectiveType ? String(connection.effectiveType).toLowerCase() : '';
        if (type === '4g') return { label: 'Good', key: 'good' };
        if (type === '3g' || type === '2g' || type === 'slow-2g') return { label: 'Poor', key: 'poor' };

        return { label: 'Good', key: 'good' };
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('db-connection-quality');
        if (!statusElement) return;

        const quality = this.resolveConnectionQuality();
        statusElement.textContent = quality.label;
        statusElement.className = `connection-status${quality.key ? ` ${quality.key}` : ''}`;
    }

    startConnectionStatusUpdates() {
        this.updateConnectionStatus();
        setInterval(() => this.updateConnectionStatus(), 10000);
    }

    convertGoogleDriveUrl(url) {
        if (!url) return null;
        if (!url.includes('drive.google.com')) return url;
        
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
        }
        return url;
    }

    normalizePath(path, sheetName) {
        if (!path) return path;
        path = path.replace(/\\/g, '/');
        
        if (sheetName === 'videos') {
            path = path.replace(/Images\/Videos\//i, 'Images/videos/');
        } else if (sheetName === 'games') {
            path = path.replace(/Images\/Games\//i, 'Images/games/');
        }
        
        return path;
    }

    parseAwards(awardsString) {
        if (!awardsString) return [];
        
        const awards = [];
        const awardParts = awardsString.split(',');
        
        for (const part of awardParts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            
            const awardMatch = trimmed.match(/Award:\s*([^|]+)/);
            const locationMatch = trimmed.match(/Location:\s*(.+?)\s*\|\s*Date:/);
            const dateMatch = trimmed.match(/Date:\s*(.+)$/);
            
            if (awardMatch && locationMatch && dateMatch) {
                awards.push({
                    award: awardMatch[1].trim(),
                    location: locationMatch[1].trim(),
                    date: dateMatch[1].trim().toUpperCase()
                });
            }
        }
        
        return awards;
    }

    buildFilmFestivalAwards(videosData) {
        const awards = {};
        if (!Array.isArray(videosData)) return awards;
        
        videosData.forEach(video => {
            if (video.name && Array.isArray(video.awards) && video.awards.length > 0) {
                awards[video.name] = video.awards;
            }
        });
        
        return awards;
    }

    async fetchLastUpdated() {
        const dateElement = document.getElementById('last-updated-date');
        if (!dateElement) return;
        let cachedDate = null;
        try {
            cachedDate = localStorage.getItem('lastUpdatedOnGithub') || null;
        } catch (err) {
            cachedDate = null;
        }
        if (cachedDate) dateElement.textContent = cachedDate;
        try {
            const response = await fetch('https://api.github.com/repos/warning676/resume/commits/main');
            const data = await response.json();
            const date = new Date(data.commit.committer.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            if (formattedDate === cachedDate) return;
            dateElement.textContent = formattedDate;
            try {
                localStorage.setItem('lastUpdatedOnGithub', formattedDate);
            } catch (err) {
            }
        } catch (err) {
            if (!cachedDate) dateElement.textContent = "Recently";
        }
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('current-time');
        if (!timeElement) return;
        
        const now = new Date();
        const options = {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        
        timeElement.textContent = now.toLocaleString('en-US', options);
    }

    startTimeUpdates() {
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000);
    }

    async loadSheet(sheetName) {
        const cacheKey = `sheet_${sheetName}`;
        const timestampKey = `sheet_${sheetName}_ts`;
        
        let cachedData = null;
        let cachedTs = null;
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                cachedData = JSON.parse(cached);
            }
            const tsRaw = localStorage.getItem(timestampKey);
            if (tsRaw) {
                const n = Number(tsRaw);
                if (Number.isFinite(n)) cachedTs = n;
            }
        } catch (err) {}

        if (cachedData && cachedTs !== null && Date.now() - cachedTs < SHEET_CACHE_TTL_MS) {
            this.recordConnectionSample(null, true, false);
            this.updateConnectionStatus();
            return { data: cachedData, fromCache: true };
        }

        try {
            const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}&_=${Date.now()}`;
            const fetchStartedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const response = await fetch(url, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) throw new Error(`Could not fetch ${sheetName} sheet`);
            const text = await response.text();
            const data = this.parseGVizResponse(text, sheetName);
            const fetchEndedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            this.recordConnectionSample(fetchEndedAt - fetchStartedAt, false, false);
            this.updateConnectionStatus();
            
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(timestampKey, String(Date.now()));
            } catch (err) {}
            
            return { data, fromCache: false };
        } catch (err) {
            if (cachedData) {
                console.warn(`Using cached data for ${sheetName} due to fetch error:`, err);
                this.recordConnectionSample(null, true, true);
                this.updateConnectionStatus();
                return { data: cachedData, fromCache: true };
            }
            this.recordConnectionSample(null, false, true);
            this.updateConnectionStatus();
            throw err;
        }
    }

    async loadAllData() {
        const sheets = ['videos', 'games', 'skills', 'Achievements', 'School', 'Courses'];
        const data = {};
        let allCached = true;
        try {
            for (const sheet of sheets) {
                const result = await this.loadSheet(sheet);
                data[sheet] = result.data;
                if (!result.fromCache) allCached = false;
            }
            return { data, allCached };
        } catch (err) {
            throw err;
        }
    }

    parseGVizResponse(text, sheetName = '') {
        const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
        if (!match) return [];
        const obj = JSON.parse(match[1]);
        const table = obj.table;
        const headerMap = {
            'Name': 'name',
            'Type': 'type',
            'School': 'school',
            'School Abbreviation': 'schoolAbbreviation',
            'Location': 'location',
            'Started': 'started',
            'Status': 'status',
            'GPA': 'gpa',
            'Link': 'link',
            'Badge': 'badge',
            'Date': 'date',
            'Info': 'info',
            'Completion Year': 'completionYear',
            'Credits Earned': 'creditsEarned',
            'Course ID': 'courseid',
            'Languages Used': 'languagesUsed',
            'Tools': 'tools',
            'YouTube Link': 'youtube',
            'Gallery': 'gallery',
            'Awards': 'awards',
            'Level': 'level',
            'Last Used': 'lastUsed',
            'Icon': 'icon',
            'Certified Status': 'certified',
            'Certification Name': 'certName',
            'Certification Details': 'certName',
        };
        const normalizeHeader = (label) => {
            const raw = (label || '').toString().trim();
            if (!raw) return '';
            const mapped = headerMap[raw];
            if (mapped) return mapped;
            return raw.toLowerCase().replace(/\s+/g, '');
        };

        const rawColLabels = (table.cols || []).map(c => (c && c.label ? String(c.label).trim() : ''));
        const allLabelsEmpty = rawColLabels.length > 0 && rawColLabels.every(label => !label);

        let cols = rawColLabels.map(normalizeHeader);
        let rows = table.rows || [];

        if (allLabelsEmpty && rows.length > 0) {
            const inferredHeaders = (rows[0].c || []).map(cell => {
                if (!cell) return '';
                if (cell.v !== null && cell.v !== undefined) return String(cell.v).trim();
                if (cell.f !== null && cell.f !== undefined) return String(cell.f).trim();
                return '';
            });
            cols = inferredHeaders.map(normalizeHeader);
            rows = rows.slice(1);
        }

        return rows.map(row => {
            const item = {};
            row.c.forEach((cell, i) => {
                const key = cols[i];
                if (!key) return;
                let val = cell ? cell.v : null;
                if (key === 'gallery' && val) {
                    const separator = val.includes(',') ? ',' : ' ';
                    val = val.split(separator).map(s => {
                        const trimmed = s.trim();
                        if (!trimmed) return null;
                        
                        if (trimmed.startsWith('http')) return trimmed;
                        
                        let processedPath = this.normalizePath(trimmed, sheetName);
                        
                        if (!processedPath.startsWith('http') && !processedPath.startsWith('../') && !processedPath.startsWith('Images/')) {
                            if (sheetName === 'games') {
                                processedPath = `Images/games/${processedPath}`;
                            } else if (sheetName === 'videos') {
                                processedPath = `Images/videos/${processedPath}`;
                            }
                        }
                        
                        return processedPath;
                    }).filter(s => s);
                } else if (key === 'date' || key === 'lastUsed' || key === 'started' || key === 'startdate' || key === 'enddate' || key === 'ended') {
                    val = (cell && cell.f) ? cell.f : val;
                    if (typeof val === 'string') {
                        const gvizDateMatch = val.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
                        if (gvizDateMatch) {
                            const year = Number.parseInt(gvizDateMatch[1], 10);
                            const monthIndex = Number.parseInt(gvizDateMatch[2], 10);
                            const day = Number.parseInt(gvizDateMatch[3], 10);
                            const dateObj = new Date(year, monthIndex, day);
                            if (!Number.isNaN(dateObj.getTime())) {
                                val = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                            }
                        }
                    }
                } else if (key === 'certified' && cell) {
                    val = cell.v === true || String(cell.f).toUpperCase() === 'TRUE';
                } else if (key === 'icon' && val && typeof val === 'string') {
                    val = this.convertGoogleDriveUrl(val);
                } else if (key === 'awards' && val && typeof val === 'string') {
                    val = this.parseAwards(val);
                }
                item[key] = val;
            });
            
            return item;
        });
    }
}
