export function normalizeServiceName(value: string): string {
  return value.normalize("NFKC").replace(/\p{Cf}/gu, "").replace(/\s+/g, " ").trim();
}

export function serviceNameKey(value: string): string {
  return normalizeServiceName(value)
    .replace(/&/g, " and ")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function uniqueServiceNames(value?: string | string[] | null): string[] {
  const values = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();

  return values
    .flatMap(name => typeof name === "string" ? name.split(",") : [])
    .map(normalizeServiceName)
    .filter((name) => {
      const key = serviceNameKey(name);
      if (!key || seen.has(key))
        return false;

      seen.add(key);
      return true;
    });
}

export function hasServiceNamePrefixCollision(value?: string | string[] | null): boolean {
  const keys = uniqueServiceNames(value).map(serviceNameKey);

  return keys.some((name, index) => keys.some((other, otherIndex) =>
    index !== otherIndex && name.startsWith(`${other} `),
  ));
}
