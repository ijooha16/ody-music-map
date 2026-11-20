export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",

  nickname: "/nickname",
  tutorial: "/tutorial",

  search: "/search",

  profile: "/profile",

  friends: "/friends",
  chart: "/chart",
  me: "/me",
} as const;

export const APP_ROUTES: readonly string[] = [ROUTES.home, ROUTES.friends, ROUTES.chart, ROUTES.me, ROUTES.search];
