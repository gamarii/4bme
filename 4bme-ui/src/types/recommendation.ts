export type RecommendationOption = {
  engineerId: string;
  engineerName: string;
  totalScore: number;
  breakdown: {
    skillMatch: number;
    workload: number;
    proximity: number;
  };
  explanation: string;
};

export type RecommendationResponse = {
  recommended: RecommendationOption | null;
  alternatives: RecommendationOption[];
  all: RecommendationOption[];
};