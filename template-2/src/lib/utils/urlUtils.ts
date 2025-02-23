export function normalizeUrl(url: string): string {
  // Remove protocol (http:// or https://)
  let normalized = url.replace(/^(https?:\/\/)/, '');
  
  // Remove www.
  normalized = normalized.replace(/^www\./, '');
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  // Remove any path, query parameters, or hash
  normalized = normalized.split('/')[0];
  
  return normalized.toLowerCase();
} 