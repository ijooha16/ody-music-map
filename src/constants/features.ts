type Features = { profile: boolean; playlist: boolean; social: boolean; chart: boolean; contest: boolean; playHint: boolean };

export const FEATURES: Features = {
  profile: true,

  playlist: true,

  social: true,

  chart: true,

  contest: true,

  playHint: false,
};

const panelsFor = (f: typeof FEATURES): Record<string, boolean> => ({
  song: true,
  journey: true,
  feed: f.profile,
  playlist: f.playlist,
  friends: f.social,
  chart: f.chart,
});

export const PANEL_ENABLED = panelsFor(FEATURES);

