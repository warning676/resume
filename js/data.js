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

    async fetchLastUpdated() {
        const dateElement = document.getElementById('last-updated-date');
        if (!dateElement) return;
        try {
            const response = await fetch('https://api.github.com/repos/warning676/resume/commits/main');
            const data = await response.json();
            const date = new Date(data.commit.committer.date);
            dateElement.textContent = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (err) {
            dateElement.textContent = "Recently";
        }
    }

    async loadAllData() {
        const sheets = ['videos', 'games', 'skills'];
        const data = {};
        try {
            for (const sheet of sheets) {
                const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:json&sheet=${sheet}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Could not fetch ${sheet} sheet`);
                const text = await response.text();
                data[sheet] = this.parseGVizResponse(text, sheet);
            }
            return data;
        } catch (err) {
            console.error("Error loading spreadsheet data:", err);
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
                }
                item[key] = val;
            });
            
            return item;
        });
    }
}
