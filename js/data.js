class DataService {
    constructor(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
    }

    convertGoogleDriveUrl(url) {
        if (!url) return null;
        if (!url.includes('drive.google.com')) return url;
        
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            return `https://lh3.google.com/d/${fileId}=w1200`;
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
            timeZone: 'America/Los_Angeles',
            weekday: 'short',
            month: 'short',
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
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                cachedData = JSON.parse(cached);
            }
        } catch (err) {}

        try {
            const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}&_=${Date.now()}`;
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
            
            try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(timestampKey, String(Date.now()));
            } catch (err) {}
            
            return { data, fromCache: false };
        } catch (err) {
            if (cachedData) {
                console.warn(`Using cached data for ${sheetName} due to fetch error:`, err);
                return { data: cachedData, fromCache: true };
            }
            throw err;
        }
    }

    async loadAllData() {
        const sheets = ['videos', 'games', 'skills'];
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
            'Badge': 'badge',
            'Date': 'date',
            'Info': 'info',
            'Tools': 'tools',
            'YouTube Link': 'youtube',
            'Gallery': 'gallery',
            'Awards': 'awards',
            'Level': 'level',
            'Last Used': 'lastUsed',
            'Icon': 'icon',
            'Certified Status': 'certified',
            'Certification Name': 'certName',
        };
        const cols = table.cols.map(c => headerMap[c.label] || c.label.toLowerCase());

        return table.rows.map(row => {
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
                } else if (key === 'date' || key === 'lastUsed') {
                    val = (cell && cell.f) ? cell.f : val;
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
