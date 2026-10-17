/** Resolves a public/ asset beneath Vite's configured base path, including relative bases. */
export function publicAssetUrl(path: string, baseUrl: string): string {
  const relativePath = path.replace(/^\/+/, '');
  if (!relativePath || relativePath.split('/').some(segment => segment === '..' || segment === '.')) {
    throw new Error(`Invalid public asset path: ${path}`);
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${relativePath}`;
}
