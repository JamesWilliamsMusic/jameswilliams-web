import DOMPurify from 'isomorphic-dompurify';

export function stripHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
