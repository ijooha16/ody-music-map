export function acceptsGzip(header: string | null | undefined): boolean {
  if (!header) return false;
  let star = false;
  for (const part of header.split(",")) {
    const [name, ...params] = part.trim().toLowerCase().split(";");
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const weight = q === undefined ? 1 : Number(q.slice(2));
    if (name === "gzip") return weight > 0;
    if (name === "*") star = weight > 0;
  }
  return star;
}
