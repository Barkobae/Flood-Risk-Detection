
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface FloodDataPoint {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  rainfall: number; // mm
  temperature: number; // °C
  humidity: number; // %
  riverDischarge: number; // m³/s
  waterLevel: number; // m
  elevation: number; // m
  landCover: string;
  soilType: string;
  populationDensity: number;
  infrastructureScore: number; // 1-10
  historicalFloods: number;
}

export interface PredictionOutput {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  featureImportance: { name: string; value: number }[];
}

export interface AIReasoning {
  summary: string;
  contributingFactors: string[];
  recommendations: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
