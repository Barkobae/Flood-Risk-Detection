
import { FloodDataPoint, PredictionOutput, RiskLevel } from '../types';
import { FEATURE_WEIGHTS } from '../constants';

export const predictFloodRisk = (data: FloodDataPoint): PredictionOutput => {
  // Normalize and weight features to calculate a risk score 0-100
  // Derived from "Flood Risk in India" dataset patterns
  let score = 0;

  // Rainfall contribution - High impact in Indian monsoons (Threshold ~200mm)
  const rainfallNorm = Math.min(data.rainfall, 600) / 600;
  score += rainfallNorm * FEATURE_WEIGHTS.rainfall * 100;

  // Water Level relative to safety (Assumed bankfull at 10m for riverine)
  const waterLevelNorm = Math.min(data.waterLevel, 20) / 20;
  score += waterLevelNorm * FEATURE_WEIGHTS.waterLevel * 100;

  // River Discharge - Extreme values common in Brahmaputra/Ganga
  const dischargeNorm = Math.min(data.riverDischarge, 25000) / 25000;
  score += dischargeNorm * FEATURE_WEIGHTS.riverDischarge * 100;

  // Topography - Low elevation (coastal/delta) is high risk
  // Elevation impact capped at 500m for risk assessment
  const elevContribution = (1 - Math.min(data.elevation, 500) / 500) * Math.abs(FEATURE_WEIGHTS.elevation) * 100;
  score += elevContribution;

  // Historical vulnerability
  score += (Math.min(data.historicalFloods, 30) / 30) * FEATURE_WEIGHTS.historicalFloods * 100;

  // Urban Density / Population impact
  score += (Math.min(data.populationDensity, 25000) / 25000) * FEATURE_WEIGHTS.populationDensity * 100;

  // Infrastructure Mitigation (inverse risk)
  score += (1 - data.infrastructureScore / 10) * Math.abs(FEATURE_WEIGHTS.infrastructureScore) * 100;

  // Final Score Normalization
  score = Math.min(Math.max(score, 0), 100);

  let level: RiskLevel = RiskLevel.LOW;
  if (score > 70) level = RiskLevel.HIGH;
  else if (score > 40) level = RiskLevel.MEDIUM;

  // XAI: Dynamic Feature Importance based on current input values
  const importance = [
    { name: 'Monsoon Rainfall', value: rainfallNorm * FEATURE_WEIGHTS.rainfall * 100 },
    { name: 'Hydrological Level', value: waterLevelNorm * FEATURE_WEIGHTS.waterLevel * 100 },
    { name: 'Riverine Discharge', value: dischargeNorm * FEATURE_WEIGHTS.riverDischarge * 100 },
    { name: 'Terrain Profile', value: elevContribution },
    { name: 'Vulnerability Record', value: (Math.min(data.historicalFloods, 30) / 30) * FEATURE_WEIGHTS.historicalFloods * 100 }
  ].sort((a, b) => b.value - a.value);

  return { riskScore: score, riskLevel: level, featureImportance: importance };
};
