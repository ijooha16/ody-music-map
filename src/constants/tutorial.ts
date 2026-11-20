export const TUTORIAL_STEPS = [
  {
    key: "zoom",
    title: "확대해보세요",
    description: "휠을 굴려 별지도를 확대해보세요. 확대할수록 별이 더 드러나고, 화면 안 곡이 충분히 줄면 벽에 닿아요. 계속 밀면 다음 겹으로 파고들어요.",
    task: "zoom",

    spotlight: [],
    hint: "wheel",
    card: "top",
    cta: "",
    veil: true,
  },
  {
    key: "click",
    title: "이 별을 눌러보세요",
    description: "밝게 짚어 둔 별을 눌러보세요. 곡 상세가 열리고 화면이 그 별로 옮겨져요. 재생을 눌러야 내 위치가 따라갑니다.",
    task: "select",

    spotlight: [],
    hint: "star",
    card: "top",
    cta: "",
    veil: true,
  },
  {
    key: "nearby",
    title: "주변을 탐색해보세요",
    description: "곡 상세에서 주변 탐색을 켜면 소리가 가장 닮은 10곡이 고리로 펼쳐져요. 실제로 닮게 들리는지가 이번 테스트의 질문입니다.",
    task: "nearby",
    spotlight: ["nearby"],
    hint: "none",

    card: "left",
    cta: "",
    veil: true,
  },
  {
    key: "look",
    title: "이렇게 펼쳐져요",
    description: "가운데가 기준 곡, 둘레가 소리로 가장 가까운 10곡이에요. 하나씩 눌러 들어보세요. 다 들어봤으면 오른쪽 여정 버튼을 누르세요.",

    task: "look",
    spotlight: ["journey"],
    hint: "none",

    card: "right",
    cta: "",
    veil: true,
  },
  {
    key: "journey-start",
    title: "여정, 출발곡부터",
    description: "오른쪽 여정 탭을 열고 여정 만들기를 누른 다음, 위 칸에 출발곡을 고르세요. 상자에서 검색하거나 지도에서 별을 눌러도 돼요.",
    task: "journey-start",

    spotlight: ["journey-composer", "panel-journey", "journey"],
    hint: "none",
    card: "bottom",
    cta: "",
    veil: true,
  },
  {
    key: "journey-end",
    title: "이제 도착곡",
    description: "아래 칸에 도착곡을 고르세요. 여기서 저기까지 소리가 어떻게 이어지는지를 보는 겁니다.",
    task: "journey-end",
    spotlight: ["journey-composer", "panel-journey", "journey"],
    hint: "none",
    card: "bottom",
    cta: "",
    veil: true,
  },
  {
    key: "journey-create",
    title: "여정 만들기를 누르세요",
    description: "두 곡을 골랐다고 경로가 생기지는 않아요. 여정 만들기를 눌러야 두 곡 사이를 이어 주는 곡들이 지도에 그려집니다.",
    task: "journey",

    spotlight: ["journey-create", "journey-composer", "panel-journey", "journey"],
    hint: "none",
    card: "bottom",
    cta: "",
    veil: true,
  },
  {
    key: "journey-look",
    title: "여정이 그려졌어요",
    description: "두 곡을 잇는 별들이 순서대로 놓였어요. 눌러서 들어보면 소리가 조금씩 옮겨 갑니다 — 그 흐름이 자연스러운지가 설문에서 물어볼 내용이에요.",

    task: "done",
    spotlight: [],
    hint: "none",
    card: "bottom",
    cta: "다 봤어요",

    veil: false,
  },
] as const;
export type TutorialTask = (typeof TUTORIAL_STEPS)[number]["task"];
