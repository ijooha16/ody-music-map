import { FRIEND_MARKER } from "@/constants";
import { FONTS, genreRgb, rgba } from "@/constants/design-tokens";
import type { NearbyUser } from "@/types";
import type { MapEngine, VisibleFriend } from "../engine/map-engine";
import { drawCropped, photoFor } from "@/lib/avatar-photo";
import { avatarFor, ME_AVATAR, trailOf } from "./sprites";
import { queueSlots, type QueueInput } from "./queue-slots";

const TEAL: readonly [number, number, number] = [79, 227, 206];

export function drawVisor(g: CanvasRenderingContext2D, px: number, py: number, R: number, u: NearbyUser) {
  const fade = g.globalAlpha;
  g.save();
  g.beginPath();
  g.arc(px, py, R, 0, 6.284);
  g.clip();

  const photo = photoFor(u.imageUrl);
  if (photo) drawCropped(g, photo, px - R, py - R, R * 2);
  else g.drawImage(avatarFor(u), px - R, py - R, R * 2, R * 2);
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = 0.3 * fade;
  g.fillStyle = "#dfeaff";
  g.beginPath();
  g.ellipse(px - R * 0.34, py - R * 0.42, R * 0.66, R * 0.34, -0.7, 0, 6.284);
  g.fill();
  g.restore();
  g.beginPath();
  g.arc(px, py, R, 0, 6.284);
  g.strokeStyle = "rgba(10,16,30,.85)";
  g.lineWidth = 2;
  g.stroke();
}

export function drawHelmet(g: CanvasRenderingContext2D, px: number, py: number, R: number, rgb: readonly [number, number, number], hot: boolean) {
  g.beginPath();
  g.arc(px, py, R * 1.3, 0, 6.284);
  g.fillStyle = "rgba(186,206,240,.13)";
  g.fill();
  g.lineWidth = 1.5;
  g.strokeStyle = hot ? rgba(rgb, 0.9) : "rgba(212,229,255,.5)";
  g.stroke();

  g.fillStyle = "rgba(196,214,245,.32)";
  const pw = R * 0.36;
  const ph = R * 0.62;
  g.beginPath();
  g.roundRect(px - R * 1.52, py - ph / 2, pw, ph, pw * 0.45);
  g.fill();
  g.beginPath();
  g.roundRect(px + R * 1.16, py - ph / 2, pw, ph, pw * 0.45);
  g.fill();
  g.strokeStyle = "rgba(230,242,255,.35)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(px, py, R * 1.16, -2.5, -0.9);
  g.stroke();
}

export function drawShip(g: CanvasRenderingContext2D, px: number, py: number, R: number, ang: number, t: number) {
  g.save();
  g.translate(px, py);
  g.rotate(ang);

  const flicker = 0.78 + 0.22 * Math.sin(t * 8.5 + px * 0.6);
  const plume = (len: number, halfW: number, alpha: number) => {
    g.fillStyle = rgba(TEAL, alpha);
    g.beginPath();
    g.moveTo(-halfW, R * 1.66);

    g.bezierCurveTo(-halfW, R * 1.66 + len * 0.55, -halfW * 0.5, R * 1.66 + len, 0, R * 1.66 + len);
    g.bezierCurveTo(halfW * 0.5, R * 1.66 + len, halfW, R * 1.66 + len * 0.55, halfW, R * 1.66);
    g.closePath();
    g.fill();
  };
  plume(R * 1.25 * flicker, R * 0.42, 0.38);
  plume(R * 0.72 * flicker, R * 0.22, 0.85);

  g.fillStyle = rgba(TEAL, 1);
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(sx * R * 0.75, R * 0.55);
    g.bezierCurveTo(sx * R * 1.25, R * 0.85, sx * R * 1.45, R * 1.25, sx * R * 1.4, R * 1.55);
    g.bezierCurveTo(sx * R * 1.25, R * 1.6, sx * R * 0.9, R * 1.5, sx * R * 0.65, R * 1.4);
    g.closePath();
    g.fill();
  }

  const body = () => {
    g.beginPath();
    g.moveTo(0, -R * 1.25);
    g.bezierCurveTo(R * 0.65, -R * 1.25, R * 1.05, -R * 0.5, R * 1.05, R * 0.15);
    g.bezierCurveTo(R * 1.05, R * 0.8, R * 0.75, R * 1.35, R * 0.45, R * 1.5);
    g.lineTo(-R * 0.45, R * 1.5);
    g.bezierCurveTo(-R * 0.75, R * 1.35, -R * 1.05, R * 0.8, -R * 1.05, R * 0.15);
    g.bezierCurveTo(-R * 1.05, -R * 0.5, -R * 0.65, -R * 1.25, 0, -R * 1.25);
    g.closePath();
  };
  body();
  g.fillStyle = "#e9f1ff";
  g.fill();

  g.save();
  body();
  g.clip();
  g.fillStyle = "#cfd9f7";
  g.fillRect(0, -R * 1.3, R * 1.2, R * 3);
  g.restore();

  g.fillStyle = "#a67cff";
  g.beginPath();
  g.moveTo(-R * 0.45, R * 1.5);
  g.lineTo(R * 0.45, R * 1.5);
  g.bezierCurveTo(R * 0.45, R * 1.65, R * 0.25, R * 1.75, 0, R * 1.75);
  g.bezierCurveTo(-R * 0.25, R * 1.75, -R * 0.45, R * 1.65, -R * 0.45, R * 1.5);
  g.closePath();
  g.fill();

  g.fillStyle = "#3a4761";
  g.beginPath();
  g.arc(0, 0, R * 0.84, 0, 6.284);
  g.fill();
  g.fillStyle = "#a67cff";
  g.beginPath();
  g.arc(0, 0, R * 0.72, 0, 6.284);
  g.fill();
  g.fillStyle = "rgba(255,255,255,.35)";
  g.beginPath();
  g.arc(-R * 0.22, -R * 0.22, R * 0.16, 0, 6.284);
  g.fill();
  g.restore();
}

export function meAvatar(e: MapEngine): NearbyUser {
  const p = e.myProfile;
  return p ? { ...ME_AVATAR, nickname: p.nickname ?? ME_AVATAR.nickname, imageUrl: p.imageUrl } : ME_AVATAR;
}

export function drawQueue(g: CanvasRenderingContext2D, px: number, py: number, R: number, ang: number, t: number, queue: QueueInput, slotsOut?: Map<string, { x: number; y: number }>): { x: number; y: number } | null {
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);

  const rr = R * 0.68;
  const step = R * 1.92;
  const slots = queueSlots(queue);
  if (!slots.length) return null;
  let minePos: { x: number; y: number } | null = null;
  const shown = Math.min(5, slots.length);
  const extra = slots.length - shown;
  const at = (i: number): [number, number] => {
    const wob = Math.sin(t * 2.2 - i * 0.9) * R * 0.17;
    const d = step * (i + 2.7);
    return [px + nx * d - ny * wob, py + ny * d + nx * wob];
  };
  g.save();
  g.strokeStyle = "rgba(180,205,245,.28)";
  g.lineWidth = 1.1;
  g.setLineDash([3, 4]);
  g.beginPath();
  g.moveTo(px + nx * R * 1.2, py + ny * R * 1.2);
  for (let i = 0; i < shown + (extra > 0 ? 1 : 0); i++) {
    const [qx, qy] = at(i);
    g.lineTo(qx, qy);
  }
  g.stroke();
  g.restore();
  for (let i = 0; i < shown; i++) {
    const [qx, qy] = at(i);
    const { user, mine } = slots[i];
    const rgb: readonly [number, number, number] = mine ? TEAL : genreRgb(user.genreId);
    drawHelmet(g, qx, qy, rr, rgb, mine);
    drawVisor(g, qx, qy, rr, user);
    if (!mine) slotsOut?.set(user.email, { x: qx, y: qy - rr });
    if (mine) {
      minePos = { x: qx, y: qy - rr };
      g.beginPath();
      g.arc(qx, qy, rr * 1.75, 0, 6.284);
      g.strokeStyle = "rgba(79,227,206,.9)";
      g.lineWidth = 1.6;
      g.stroke();
      g.fillStyle = "rgba(79,227,206,.95)";
      g.font = `600 10px ${FONTS.mono}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("나", qx, qy + rr * 2.6);
    }
  }
  if (extra > 0) {
    const [qx, qy] = at(shown);
    if (slotsOut) for (let i = shown; i < slots.length; i++) if (!slots[i].mine) slotsOut.set(slots[i].user.email, { x: qx, y: qy - rr * 1.28 });
    g.beginPath();
    g.arc(qx, qy, rr * 1.28, 0, 6.284);
    g.fillStyle = "rgba(14,21,38,.9)";
    g.fill();
    g.strokeStyle = "rgba(212,229,255,.6)";
    g.lineWidth = 1.4;
    g.stroke();
    g.fillStyle = "rgba(233,241,255,.9)";
    g.font = `600 ${(rr * 1.1).toFixed(1)}px ${FONTS.mono}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(`+${extra}`, qx, qy);
  }
  return minePos;
}

function drawCrowd(g: CanvasRenderingContext2D, e: MapEngine) {
  if (e.crowdLayer !== e.layer || !e.crowd.length) return;
  g.save();
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const c of e.crowd) {
    const { px, py } = e.worldToScreen(c.x, c.y);

    const r = 11 + Math.min(13, Math.log2(Math.max(1, c.count)) * 3.2);
    g.globalAlpha = 0.16;
    g.fillStyle = "#5c9dff";
    g.beginPath();
    g.arc(px, py, r, 0, 6.3);
    g.fill();
    g.globalAlpha = 0.85;
    g.strokeStyle = "#9fe1cb";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(px, py, r, 0, 6.3);
    g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = "#e9f1ff";
    g.font = `600 ${Math.round(r * 0.78)}px ${FONTS.body}`;
    g.fillText(String(c.count), px, py + 0.5);
  }
  g.restore();
}

export function drawFriends(g: CanvasRenderingContext2D, e: MapEngine) {
  drawCrowd(g, e);

  e.rideMeScreen = null;
  if (e.friendAlpha < 0.01) return;
  const t = e.time;
  const fade = e.friendAlpha;
  g.globalCompositeOperation = "source-over";

  g.lineCap = "round";
  g.lineWidth = 1.3;
  for (const fr of e.visFriends) {
    const tr = trailOf(fr.user.email);
    const rgb = genreRgb(fr.user.genreId);
    const sc = 24 * fr.scale;
    for (let k = 0; k < tr.length - 1; k++) {
      const a0 = 1 - k / (tr.length - 1);
      const pulse = 0.55 + 0.45 * Math.sin(t * 0.8 - k * 0.55 + fr.px * 0.01);
      g.globalAlpha = 0.085 * a0 * pulse * fade;
      g.strokeStyle = rgba(rgb, 1);
      g.beginPath();
      g.moveTo(fr.px + tr[k][0] * sc, fr.py + tr[k][1] * sc);
      g.lineTo(fr.px + tr[k + 1][0] * sc, fr.py + tr[k + 1][1] * sc);
      g.stroke();
    }
  }
  g.globalAlpha = fade;

  g.textAlign = "center";
  g.textBaseline = "middle";

  const tier = (v: VisibleFriend) => (v.isLeader ? 2 : v.user.riderCount > 0 ? 1 : 0);
  const order = [...e.visFriends].sort((a, b) => tier(a) - tier(b) || a.scale - b.scale);
  for (const fr of order) {
    const { px, py, user: u, isLeader } = fr;
    const riders = u.riderCount + (isLeader ? 1 : 0);
    const ship = riders > 0;

    const R = ship ? FRIEND_MARKER.leaderRadiusPx : (isLeader ? FRIEND_MARKER.leaderRadiusPx : FRIEND_MARKER.radiusPx) * fr.scale;
    const rgb = genreRgb(u.genreId);
    if (isLeader) {
      const rr = R * 1.9 + Math.sin(t * 2.4) * 3.5;
      g.beginPath();
      g.arc(px, py, rr, 0, 6.284);
      g.strokeStyle = "rgba(166,124,255,.5)";
      g.lineWidth = 1.2;
      g.stroke();
    }
    if (ship) {
      const ang = e.shipTurn.step(u.email, fr.heading + Math.PI / 2, t * 1000);

      const SR = R * FRIEND_MARKER.shipScale;

      if (isLeader) e.rideMeScreen = drawQueue(g, px, py, SR, ang, t, { me: meAvatar(e), riders: [], count: Math.max(0, u.riderCount - 1) });
      drawShip(g, px, py, SR, ang, t);

      drawVisor(g, px, py, SR * 0.72, u);
    } else {
      drawHelmet(g, px, py, R, rgb, isLeader);
      drawVisor(g, px, py, R, u);
    }

    g.beginPath();
    g.arc(px + R * (ship ? 0.95 : 0.82), py + R * (ship ? 0.95 : 0.82), 2.9, 0, 6.284);
    g.fillStyle = "#4fe3ce";
    g.fill();
    g.strokeStyle = "#02040a";
    g.lineWidth = 1.3;
    g.stroke();

    const more = fr.stacked.length;
    if (more > 0) {
      const bx = px - R * (ship ? 0.95 : 0.82);
      const by = py - R * (ship ? 0.95 : 0.82);
      const label = `+${more}`;
      g.font = `600 11px ${FONTS.body}`;

      const w = Math.max(15, g.measureText(label).width + 9);
      const h = 13;
      g.beginPath();
      g.roundRect(bx - w / 2, by - h / 2, w, h, h / 2);
      g.fillStyle = "rgba(2,4,10,.82)";
      g.fill();
      g.strokeStyle = rgba(rgb, 0.75);
      g.lineWidth = 1.1;
      g.stroke();
      g.fillStyle = "#e9f1ff";
      g.fillText(label, bx, by + 0.5);
    }

    g.fillStyle = "rgba(233,241,255,.62)";
    g.font = `500 ${FRIEND_MARKER.namePx}px ${FONTS.body}`;
    g.fillText(u.nickname ?? "", px, py + R * (ship ? 2.2 : 1.75) + 22);
  }
  g.globalAlpha = 1;
}
