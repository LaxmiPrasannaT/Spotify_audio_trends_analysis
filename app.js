// Spotify Catalog & Audio Trends Analysis - Frontend Logic

document.addEventListener('DOMContentLoaded', async () => {
    // Application State
    let state = {
        allTracks: [],
        filteredTracks: [],
        correlationData: null,
        decadeTrends: [],
        yearlyTrends: [],
        genreProfiles: [],
        selectedDecade: 'all',
        selectedGenre: 'all',
        selectedArtist: '',
        currentPage: 1,
        pageSize: 10
    };

    // Chart instances
    let scatterChart = null;
    let durationChart = null;
    let radarChart = null;

    // Element References
    const decadeFilter = document.getElementById('decade-filter');
    const genreFilter = document.getElementById('genre-filter');
    const artistSearch = document.getElementById('artist-search');
    const artistList = document.getElementById('artist-list');
    const clearArtistBtn = document.getElementById('clear-artist-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    const kpiTracks = document.getElementById('kpi-total-tracks');
    const kpiEnergy = document.getElementById('kpi-avg-energy');
    const kpiValence = document.getElementById('kpi-avg-valence');
    const kpiDuration = document.getElementById('kpi-avg-duration');

    const tableBody = document.getElementById('tracks-table-body');
    const filteredCountText = document.getElementById('table-filtered-count');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const paginationInfo = document.getElementById('pagination-info');

    // Decade Colors Mapping for Scatter Plot
    const decadeColors = {
        '1950s': '#48cae4',
        '1960s': '#00b4d8',
        '1970s': '#ffb703',
        '1980s': '#fb8500',
        '1990s': '#f72585',
        '2000s': '#7209b7',
        '2010s': '#9d4edd',
        '2020s': '#1DB954'
    };

    // 1. Fetch Data
    async function loadData() {
        try {
            const [tracksRes, corrRes, decadeRes, yearlyRes, genreRes] = await Promise.all([
                fetch('data/tracks_subset.json'),
                fetch('data/correlation.json'),
                fetch('data/decade_trends.json'),
                fetch('data/yearly_trends.json'),
                fetch('data/genre_profiles.json')
            ]);

            state.allTracks = await tracksRes.json();
            state.filteredTracks = [...state.allTracks];
            state.correlationData = await corrRes.json();
            state.decadeTrends = await decadeRes.json();
            state.yearlyTrends = await yearlyRes.json();
            state.genreProfiles = await genreRes.json();

            initFilters();
            updateKPIs();
            renderScatterChart();
            renderDurationChart();
            renderGenreRadarChart();
            renderCorrelationHeatmap();
            renderTable();

        } catch (error) {
            console.error("Error loading Spotify data:", error);
        }
    }

    // 2. Initialize Filter Dropdowns
    function initFilters() {
        // Populate Decades
        const decades = [...new Set(state.allTracks.map(t => t.decade))].sort();
        decades.forEach(dec => {
            const opt = document.createElement('option');
            opt.value = dec;
            opt.textContent = dec;
            decadeFilter.appendChild(opt);
        });

        // Populate Genres
        const genres = [...new Set(state.allTracks.map(t => t.genre))].sort();
        genres.forEach(gen => {
            const opt = document.createElement('option');
            opt.value = gen;
            opt.textContent = gen;
            genreFilter.appendChild(opt);
        });

        // Populate Artist Datalist
        const artists = [...new Set(state.allTracks.map(t => t.artist_name))].sort();
        artists.forEach(art => {
            const opt = document.createElement('option');
            opt.value = art;
            artistList.appendChild(opt);
        });
    }

    // 3. Filter Application Logic
    function applyFilters() {
        state.filteredTracks = state.allTracks.filter(track => {
            const matchDecade = state.selectedDecade === 'all' || track.decade === state.selectedDecade;
            const matchGenre = state.selectedGenre === 'all' || track.genre === state.selectedGenre;
            const matchArtist = !state.selectedArtist || track.artist_name.toLowerCase().includes(state.selectedArtist.toLowerCase());
            return matchDecade && matchGenre && matchArtist;
        });

        state.currentPage = 1;
        updateKPIs();
        updateScatterChart();
        renderTable();
    }

    // Event Listeners for Filters
    decadeFilter.addEventListener('change', (e) => {
        state.selectedDecade = e.target.value;
        applyFilters();
    });

    genreFilter.addEventListener('change', (e) => {
        state.selectedGenre = e.target.value;
        applyFilters();
    });

    artistSearch.addEventListener('input', (e) => {
        state.selectedArtist = e.target.value;
        clearArtistBtn.style.display = state.selectedArtist ? 'block' : 'none';
        applyFilters();
    });

    clearArtistBtn.addEventListener('click', () => {
        artistSearch.value = '';
        state.selectedArtist = '';
        clearArtistBtn.style.display = 'none';
        applyFilters();
    });

    resetFiltersBtn.addEventListener('click', () => {
        decadeFilter.value = 'all';
        genreFilter.value = 'all';
        artistSearch.value = '';
        clearArtistBtn.style.display = 'none';
        state.selectedDecade = 'all';
        state.selectedGenre = 'all';
        state.selectedArtist = '';
        applyFilters();
    });

    // 4. KPI Updates
    function updateKPIs() {
        const count = state.filteredTracks.length;
        kpiTracks.textContent = count.toLocaleString();

        if (count === 0) {
            kpiEnergy.textContent = '-';
            kpiValence.textContent = '-';
            kpiDuration.textContent = '-';
            return;
        }

        const avgEnergy = (state.filteredTracks.reduce((acc, t) => acc + t.energy, 0) / count).toFixed(3);
        const avgValence = (state.filteredTracks.reduce((acc, t) => acc + t.valence, 0) / count).toFixed(3);
        const avgDurationMin = (state.filteredTracks.reduce((acc, t) => acc + t.duration_min, 0) / count);

        kpiEnergy.textContent = avgEnergy;
        kpiValence.textContent = avgValence;

        const mins = Math.floor(avgDurationMin);
        const secs = Math.round((avgDurationMin - mins) * 60);
        kpiDuration.textContent = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }

    // 5. Chart 1: Scatter Plot (Valence vs Energy grouped by decade)
    function renderScatterChart() {
        const ctx = document.getElementById('valence-energy-chart').getContext('2d');
        const datasets = buildScatterDatasets();

        scatterChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const raw = context.raw;
                                return `${raw.track_name} by ${raw.artist} (${raw.year}): Valence=${raw.x}, Energy=${raw.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Valence (Positivity)', color: '#94a3b8', font: { weight: 'bold' } },
                        min: 0,
                        max: 1,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        title: { display: true, text: 'Energy (Intensity)', color: '#94a3b8', font: { weight: 'bold' } },
                        min: 0,
                        max: 1,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }

    function buildScatterDatasets() {
        const decadeGroups = {};
        state.filteredTracks.forEach(t => {
            if (!decadeGroups[t.decade]) decadeGroups[t.decade] = [];
            decadeGroups[t.decade].push({
                x: t.valence,
                y: t.energy,
                track_name: t.track_name,
                artist: t.artist_name,
                year: t.year
            });
        });

        return Object.keys(decadeGroups).sort().map(dec => ({
            label: dec,
            data: decadeGroups[dec],
            backgroundColor: decadeColors[dec] || '#1DB954',
            pointRadius: 4,
            pointHoverRadius: 7
        }));
    }

    function updateScatterChart() {
        if (!scatterChart) return;
        scatterChart.data.datasets = buildScatterDatasets();
        scatterChart.update();
    }

    // 6. Chart 2: Song Duration Trend Line Chart
    function renderDurationChart() {
        const ctx = document.getElementById('duration-trend-chart').getContext('2d');
        const years = state.yearlyTrends.map(d => d.year);
        const durations = state.yearlyTrends.map(d => d.duration_min);

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(72, 202, 228, 0.4)');
        gradient.addColorStop(1, 'rgba(72, 202, 228, 0.0)');

        durationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Avg Duration (Minutes)',
                    data: durations,
                    borderColor: '#48cae4',
                    borderWidth: 3,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Avg Duration: ${context.parsed.y} mins`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        title: { display: true, text: 'Duration (Minutes)', color: '#94a3b8' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }

    // 7. Chart 3: Genre Radar Chart
    function renderGenreRadarChart() {
        const ctx = document.getElementById('genre-radar-chart').getContext('2d');
        const metrics = ['danceability', 'energy', 'acousticness', 'valence', 'speechiness', 'normalized_loudness'];

        const genreColors = {
            'Pop': '#ffb703',
            'Hip-Hop': '#9d4edd',
            'Classical': '#48cae4',
            'EDM': '#1DB954',
            'Rock': '#ef233c',
            'Jazz': '#f77f00'
        };

        const datasets = state.genreProfiles.map(gp => ({
            label: gp.genre,
            data: metrics.map(m => gp[m]),
            borderColor: genreColors[gp.genre] || '#fff',
            backgroundColor: `${genreColors[gp.genre]}22`,
            borderWidth: 2,
            pointRadius: 3
        }));

        radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Danceability', 'Energy', 'Acousticness', 'Valence', 'Speechiness', 'Loudness (Norm)'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { color: '#94a3b8', font: { size: 10 } }
                    }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        pointLabels: { color: '#94a3b8', font: { size: 11, weight: '500' } },
                        ticks: { display: false, min: 0, max: 1 }
                    }
                }
            }
        });
    }

    // 8. Render Pearson Correlation Heatmap Table
    function renderCorrelationHeatmap() {
        const table = document.getElementById('correlation-table');
        if (!state.correlationData) return;

        const cols = state.correlationData.columns;
        const vals = state.correlationData.values;

        let html = '<thead><tr><th>Metric</th>';
        cols.forEach(c => { html += `<th>${c}</th>`; });
        html += '</tr></thead><tbody>';

        cols.forEach((rowName, rIdx) => {
            html += `<tr><td class="cell-label">${rowName}</td>`;
            cols.forEach((colName, cIdx) => {
                const val = vals[rIdx][cIdx];
                let heatClass = 'heat-zero';
                if (val >= 0.6) heatClass = 'heat-high-pos';
                else if (val >= 0.3) heatClass = 'heat-mid-pos';
                else if (val > 0.05) heatClass = 'heat-low-pos';
                else if (val <= -0.6) heatClass = 'heat-high-neg';
                else if (val <= -0.3) heatClass = 'heat-mid-neg';
                else if (val < -0.05) heatClass = 'heat-low-neg';

                html += `<td class="val-cell ${heatClass}" title="${rowName} vs ${colName}: ${val}">${val}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody>';
        table.innerHTML = html;
    }

    // 9. Render Track Explorer Data Table & Pagination
    function renderTable() {
        const total = state.filteredTracks.length;
        filteredCountText.textContent = `Showing ${total} of ${state.allTracks.length} tracks`;

        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        if (state.currentPage > totalPages) state.currentPage = totalPages;

        paginationInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
        prevPageBtn.disabled = state.currentPage === 1;
        nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;

        const start = (state.currentPage - 1) * state.pageSize;
        const pageItems = state.filteredTracks.slice(start, start + state.pageSize);

        if (pageItems.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 24px; color:#94a3b8;">No matching tracks found. Try resetting filters.</td></tr>`;
            return;
        }

        let html = '';
        pageItems.forEach(t => {
            const genreClass = t.genre.toLowerCase().replace(/\s+/g, '-');
            html += `
                <tr>
                    <td><strong>${t.track_name}</strong></td>
                    <td>${t.artist_name}</td>
                    <td>${t.year}</td>
                    <td><span class="genre-tag ${genreClass}">${t.genre}</span></td>
                    <td>${t.energy}</td>
                    <td>${t.valence}</td>
                    <td>${t.danceability}</td>
                    <td>${t.loudness} dB</td>
                    <td>${t.duration_min}m</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredTracks.length / state.pageSize);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    });

    // Start loading
    loadData();
});
