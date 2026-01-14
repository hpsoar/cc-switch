/**
 * Generate a provider key from provider name
 * Rules: lowercase, spaces replaced with hyphens
 * Example: "My Provider" → "my-provider"
 */
export function generateProviderKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Validate provider key format
 */
export function isValidProviderKey(key: string): boolean {
  return /^[a-z0-9-]+$/.test(key);
}
