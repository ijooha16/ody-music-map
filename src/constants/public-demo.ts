export const PUBLIC_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

const b64url = (o: object) =>
  btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export const DEMO_TOKEN = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({
  sub: "demo@ody.app",
  exp: 4102444800,
})}.demo`;
