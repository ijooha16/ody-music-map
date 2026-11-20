import type { SurveyDefinition } from "@/types/survey";

export const SURVEY_ANON_KEY = "ody_anon_id";
export const SURVEY_API = { feedback: "/bff/feedback", answered: "/bff/feedback/answered" } as const;
export const SURVEY_QUERY_KEYS = { answered: ["survey", "answered"] as const };

export const SURVEY_TARGET_LABEL = "방금 들은 곡";

const NEARBY_REASONS = [
  { value: "mood", label: "분위기 다름" },
  { value: "tempo", label: "템포 다름" },
  { value: "dup", label: "같은 곡 반복" },
  { value: "spoken", label: "음악 아님" },

  { value: "compare", label: "기준곡이 이상함" },
] as const;

const JOURNEY_REASONS = [
  { value: "mood", label: "분위기 튐" },
  { value: "tempo", label: "템포 튐" },
  { value: "dup", label: "같은 곡 반복" },
  { value: "spoken", label: "음악 아님" },

  { value: "compare", label: "앞 곡이 이상함" },
] as const;

const NEARBY: SurveyDefinition = {
  mode: "nearby",
  compareLabel: "기준곡",

  question: "비슷했나요?",
  yes: "네, 비슷해요",
  reasonQuestion: "어떤 점이 아쉬웠나요?",
  reasons: NEARBY_REASONS,
};

const JOURNEY: SurveyDefinition = {
  mode: "journey",
  compareLabel: "앞 곡",
  question: "자연스럽게 이어졌나요?",
  yes: "네, 자연스러워요",
  reasonQuestion: "어떤 점이 아쉬웠나요?",
  reasons: JOURNEY_REASONS,
};

export const SURVEYS = { nearby: NEARBY, journey: JOURNEY } as const;
