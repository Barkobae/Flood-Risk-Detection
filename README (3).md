# FloodGuard AI

An AI-enabled geospatial prototype for flood risk analysis, combining machine learning predictions, explainable AI, and interactive mapping. Built with a focus on Indian river basins including the Brahmaputra, Ganga, and coastal regions.

## Features

- **Interactive Risk Map** — Click anywhere on the map to analyze flood risk at a custom location using Leaflet.js
- **ML Risk Engine** — Weighted scoring model derived from the "Flood Risk in India" dataset, factoring in rainfall, river discharge, water level, elevation, soil type, population density, and infrastructure quality
- **Explainable AI (XAI)** — Dynamic feature importance chart showing which inputs are driving the current risk score
- **Gemini AI Insights** — Natural language analysis powered by Google Gemini, providing contributing factor identification and actionable emergency recommendations
- **Simulation Panel** — Adjust environmental parameters in real time and watch risk scores update instantly
- **Decision Assistant** — Context-aware recommendations based on the current prediction output

## Tech Stack

- React 19 + TypeScript
- Vite
- Leaflet (mapping)
- Recharts (feature importance visualization)
- Google Gemini API (`@google/genai`)
- Tailwind CSS

## Getting Started

**Prerequisites:** Node.js

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── components/
│   ├── MapContainer.tsx        # Leaflet map with click-to-analyze
│   ├── SimulationPanel.tsx     # Environmental parameter controls
│   ├── RiskDashboard.tsx       # Risk score display and AI reasoning
│   ├── FeatureImportanceChart.tsx
│   ├── DecisionAssistant.tsx
│   └── LocationSelector.tsx
├── services/
│   ├── mlEngine.ts             # Weighted ML scoring logic
│   └── geminiService.ts        # Gemini API integration
├── types.ts
└── constants.ts                # Reference locations and feature weights
```

## Risk Model

The frontend scoring engine (`services/mlEngine.ts`) scores locations from 0 to 100 across five key features: monsoon rainfall, hydrological water level, riverine discharge, terrain profile, and historical flood vulnerability. Infrastructure quality acts as a mitigation factor. Scores above 70 are classified as High risk, 40-70 as Medium, and below 40 as Low. The feature weights are derived from the Random Forest model trained in the notebook.

## Machine Learning Model

`Random_forest_final.ipynb` contains the full Random Forest pipeline that backs the frontend risk engine.

### Dataset

A synthetic dataset of 5,000 samples modelled on Indian hydrological distributions, with the following class balance:

| Risk Level | Samples |
|------------|---------|
| Low        | 3,325   |
| Medium     | 1,651   |
| High       | 24      |

### Pipeline

1. **Feature Engineering** — 19 total features (12 raw + 7 engineered):
   - `rainfall_waterLevel_interact` — rainfall × water level
   - `discharge_elevation_ratio` — river discharge / (elevation + 1)
   - `flood_vulnerability_index` — historical floods × population density / (infrastructure score + 1)
   - `rainfall_log`, `discharge_log` — log-transformed skewed features
   - `elevation_inv` — inverse elevation
   - `monsoon_index` — rainfall × humidity / 100

2. **Training** — 80/20 stratified train/test split, StratifiedKFold (k=5)

3. **Tuning** — RandomizedSearchCV over 20 configurations × 3 folds (60 fits)

### Best Parameters

```
n_estimators      : 300
max_depth         : None
max_features      : sqrt
min_samples_split : 2
min_samples_leaf  : 3
bootstrap         : True
class_weight      : None
```

### Results

| Metric              | Value  |
|---------------------|--------|
| Test Accuracy       | 90.10% |
| ROC-AUC (weighted)  | 0.9655 |
| 5-Fold CV Accuracy  | 89.36% ± 0.24% |

### Top Feature Importances (Gini)

| Feature                        | Importance |
|--------------------------------|------------|
| rainfall_mm                    | 18.24%     |
| rainfall_log                   | 17.01%     |
| rainfall_waterLevel_interact   | 14.81%     |
| monsoon_index                  | 7.46%      |
| water_level_m                  | 7.16%      |

### Sample Predictions

| Location              | Predicted Risk | Low%  | Medium% | High% |
|-----------------------|---------------|-------|---------|-------|
| Guwahati, Assam       | Medium        | 0.5   | 76.8    | 22.8  |
| Jodhpur, Rajasthan    | Low           | 99.7  | 0.3     | 0.0   |
| Srinagar, J&K         | Low           | 96.1  | 3.9     | 0.0   |
| Mumbai, Maharashtra   | Medium        | 1.8   | 77.1    | 21.1  |

The trained model is saved to `floodguard_rf_model.pkl` and can be loaded with:

```python
import joblib
bundle = joblib.load("floodguard_rf_model.pkl")
model  = bundle["model"]
```

## License

MIT
