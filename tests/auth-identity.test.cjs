/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { emailFromToken, toUserProfile, toUser } = require("../src/lib/backend.ts");

const jwt = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;
const req = (auth) => new Request("http://localhost/bff/auth/me", auth ? { headers: { authorization: auth } } : undefined);

test("액세스 토큰의 sub 를 이메일로 꺼낸다", () => {
  assert.equal(emailFromToken(req(`Bearer ${jwt({ sub: "me@ody.app", tokenType: "access" })}`)), "me@ody.app");

  assert.equal(emailFromToken(req(`Bearer ${jwt({ sub: "ody-fe-probe@example.com", jti: "x", iat: 1, exp: 2 })}`)), "ody-fe-probe@example.com");
});

test("토큰이 없거나 망가졌으면 null 이다 — 아무나 남의 정보를 물어보지 못한다", () => {
  assert.equal(emailFromToken(req(null)), null);
  assert.equal(emailFromToken(req("Bearer not-a-jwt")), null);
  assert.equal(emailFromToken(req("Bearer header..sig")), null);

  assert.equal(emailFromToken(req(`Bearer ${jwt({ sub: { email: "x@y.z" } })}`)), null);
  assert.equal(emailFromToken(req(`Bearer ${jwt({ tokenType: "access" })}`)), null);
});

const detail = (over = {}) => ({
  email: "me@ody.app",
  name: "오디",
  nickname: "우주탐험가",
  tutorialCompleted: false,
  lastActiveAt: null,
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  imageUrl: null,
  followerCnt: 12,
  followingCnt: 3,
  isFollowing: false,
  isMe: true,
  ...over,
});

test("백엔드가 준 값은 그대로 옮긴다", () => {
  const p = toUserProfile(detail());
  assert.equal(p.nickname, "우주탐험가");
  assert.equal(p.followerCount, 12);
  assert.equal(p.followingCount, 3);

  assert.equal(toUser(detail()).updatedAt, null);
});

test("가입 N일째는 당일이 1일째다", () => {
  assert.equal(toUserProfile(detail({ createdAt: new Date().toISOString() })).daysSinceJoined, 1);
  assert.equal(toUserProfile(detail()).daysSinceJoined, 4);

  assert.equal(toUserProfile(detail({ createdAt: "어제" })).daysSinceJoined, 1);
});

test("접속 중 여부는 서버가 준 isOnline 을 그대로 쓴다", () => {
  assert.equal(toUserProfile(detail({ isOnline: true })).isOnline, true);
  assert.equal(toUserProfile(detail({ isOnline: false })).isOnline, false);
});

test("로그인 시각으로 접속 여부를 가늠하지 않는다", () => {
  assert.equal(toUserProfile(detail({ lastActiveAt: new Date().toISOString(), isOnline: false })).isOnline, false);

  assert.equal(toUserProfile(detail({ lastActiveAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), isOnline: true })).isOnline, true);
});

test("필드가 없는 배포를 만나면 접속 중이 아니다", () => {
  assert.equal(toUserProfile(detail({ lastActiveAt: new Date().toISOString() })).isOnline, false);
});

test("백엔드에 없는 것은 목으로 채우지 않는다 (A-35)", () => {
  const p = toUserProfile(detail());
  assert.equal(p.nowPlaying, null);
  assert.equal(p.meetingCount, null);
  assert.equal(p.followingTarget, null);

  assert.deepEqual(p.dashboard, { exploredCount: null, discoveredCount: null, moodPreference: [] });
});

test("재생한 곡 수는 백엔드가 주면 그대로 쓴다", () => {
  assert.equal(toUserProfile(detail({ playedMusicCnt: 137 })).dashboard.exploredCount, 137);

  assert.equal(toUserProfile(detail({ playedMusicCnt: 0 })).dashboard.exploredCount, 0);
});
