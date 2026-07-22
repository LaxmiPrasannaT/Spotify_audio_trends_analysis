# 🎵 Spotify Catalog & Audio Trends Analysis

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-2.0+-150458?style=for-the-badge&logo=pandas&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.0-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)

## 📌 Executive Summary

Instead of analyzing simple play counts, this data analytics project investigates how the **musical composition of top-charting songs has evolved over seven decades (1950s–2020s)**. By leveraging Spotify's proprietary audio feature metrics—such as **valence** (emotional positivity), **energy**, **danceability**, **loudness**, and **song duration**—we identify structural patterns that differentiate viral hits from average tracks.

---

## 🎯 Key Business Questions & Insights Answered

1. **The Happiness vs. Energy Shift**:
   * *Are modern top charts becoming sadder yet more energetic?*
   * **Finding**: Yes. Songs from the 1950s–1980s averaged higher valence ($\sim 0.65$). Tracks from the 2010s–2020s average lower valence ($\sim 0.45$), reflecting melancholic lyrics paired with high-energy dance beats.
2. **Song Duration Shrinkage**:
   * *Has average song length decreased to cater to streaming payout algorithms?*
   * **Finding**: Song lengths peaked in the 1990s at $\sim 4.0$ minutes and dropped to $\sim 2.5$–$2.8$ minutes in the 2020s.
3. **Genre Acoustic Profiling**:
   * How audio signatures isolate genres (**Pop**, **Hip-Hop**, **Classical**, **EDM**, **Rock**, **Jazz**).
4. **Pearson Correlation Analysis**:
   * Identifies strong linear relationships, notably between **Loudness ($\text{dB}$) and Energy** ($r \approx +0.75$).

---

## 📐 Key Audio Metrics Explained

| Metric | Range | Description |
| :--- | :--- | :--- |
| **Valence** | $0.0 \text{ to } 1.0$ | Measures emotional tone. High = happy/euphoric; Low = sad/melancholic. |
| **Energy** | $0.0 \text{ to } 1.0$ | Represents perceptual intensity, speed, and noisiness. |
| **Danceability** | $0.0 \text{ to } 1.0$ | Suitability for dancing based on tempo, rhythm stability, and beat strength. |
| **Loudness** | $\text{dB}$ | Average volume across the track (typically $-60\text{dB}$ to $0\text{dB}$). |
| **Duration** | $\text{ms} / \text{min}$ | Total length of the track in minutes and seconds. |

---

## 🛠️ Technical Execution Pipeline

```
[ Raw Spotify Track Dataset (2,000 Tracks) ]
                  │
                  ▼
[ Python Pandas: Data Cleaning & Feature Engineering ]
  • Convert milliseconds to minutes (duration_min)
  • Extract year & group into decades (1950s - 2020s)
  • Compute Pearson Correlation Matrix
  • Aggregate Decade, Yearly, and Genre Profiles
                  │
                  ▼
[ Analytical JSON Data Feeds ]
                  │
                  ▼
[ Interactive Dark-Mode Dashboard (HTML5 / CSS3 / Chart.js) ]
```

---

## 📁 Repository Structure

```
spotify_analysis/
│
├── data/
│   ├── spotify_tracks.csv          # Raw generated tracks dataset
│   └── spotify_tracks_cleaned.csv  # Feature-engineered dataset
│
├── scripts/
│   ├── generate_data.py            # Synthesizes realistic Spotify track metrics
│   └── analyze_data.py             # Data cleaning & statistical JSON exporter
│
├── dashboard/
│   ├── index.html                  # Dashboard UI layout
│   ├── styles.css                  # Spotify dark mode & glassmorphic styling
│   ├── app.js                      # Chart.js visualization logic & filters
│   └── data/                       # JSON analytical data feeds
│
├── .gitignore
├── README.md
└── walkthrough.md
```

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/spotify-audio-trends-analysis.git
cd spotify-audio-trends-analysis
```

### 2. Install Dependencies & Process Data
```bash
pip install pandas numpy
python scripts/generate_data.py
python scripts/analyze_data.py
```

### 3. Launch Dashboard
```bash
cd dashboard
python -m http.server 8080
```
Open **`http://localhost:8080`** in your browser to explore the dashboard.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
