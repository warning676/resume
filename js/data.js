class DataService {
    constructor(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
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
                data[sheet] = this.parseGVizResponse(text);
            }
            return data;
        } catch (err) {
            console.error("Error loading spreadsheet data:", err);
            throw err;
        }
    }

    parseGVizResponse(text) {
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
                    val = val.split(',').map(s => s.trim());
                } else if (key === 'date' || key === 'lastUsed') {
                    val = (cell && cell.f) ? cell.f : val;
                } else if (key === 'certified' && cell) {
                    val = cell.v === true || String(cell.f).toUpperCase() === 'TRUE';
                }
                item[key] = val;
            });
            return item;
        });
    }
}
