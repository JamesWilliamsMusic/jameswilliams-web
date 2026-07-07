interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

const WEBINY_API_URL = process.env.WEBINY_API_URL ?? '';
const WEBINY_API_TOKEN = process.env.WEBINY_API_TOKEN ?? '';

export async function fetchFromCMS<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!WEBINY_API_URL) {
    throw new Error('WEBINY_API_URL environment variable is not set');
  }

  const response = await fetch(WEBINY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(WEBINY_API_TOKEN && { Authorization: `Bearer ${WEBINY_API_TOKEN}` }),
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Webiny CMS request failed: ${response.status} ${response.statusText}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors?.length) {
    throw new Error(`Webiny CMS GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
}
