/**
 * @jest-environment node
 */

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('fetchFromCMS', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      WEBINY_API_URL: 'https://cms.example.com/graphql',
      WEBINY_API_TOKEN: 'test-token',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function getFreshModule() {
    return (await import('@/lib/webiny/client')).fetchFromCMS;
  }

  it('sends a POST request with query and authorization header', async () => {
    const fetchFromCMS = await getFreshModule();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { listItems: { data: [] } } }),
    });

    await fetchFromCMS('query { listItems { data { id } } }');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://cms.example.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('passes variables in the request body', async () => {
    const fetchFromCMS = await getFreshModule();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { result: 'ok' } }),
    });

    await fetchFromCMS('query($id: ID!) { getItem(id: $id) }', { id: '123' });

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.variables).toEqual({ id: '123' });
  });

  it('returns parsed data on success', async () => {
    const fetchFromCMS = await getFreshModule();
    const mockData = { listHeroContents: { data: [{ id: '1', values: { title: 'Test' } }] } };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    const result = await fetchFromCMS('query { listHeroContents { data { id values { title } } } }');
    expect(result).toEqual(mockData);
  });

  it('throws when response is not ok', async () => {
    const fetchFromCMS = await getFreshModule();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchFromCMS('query { test }')).rejects.toThrow(
      'Webiny CMS request failed: 500 Internal Server Error',
    );
  });

  it('throws when GraphQL response contains errors', async () => {
    const fetchFromCMS = await getFreshModule();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: null,
        errors: [{ message: 'Field not found' }],
      }),
    });

    await expect(fetchFromCMS('query { badField }')).rejects.toThrow(
      'Webiny CMS GraphQL error: Field not found',
    );
  });

  it('throws when WEBINY_API_URL is not set', async () => {
    process.env.WEBINY_API_URL = '';
    const fetchFromCMS = await getFreshModule();

    await expect(fetchFromCMS('query { test }')).rejects.toThrow(
      'WEBINY_API_URL environment variable is not set',
    );
  });

  it('omits Authorization header when no token is set', async () => {
    process.env.WEBINY_API_TOKEN = '';
    const fetchFromCMS = await getFreshModule();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { test: true } }),
    });

    await fetchFromCMS('query { test }');

    const call = mockFetch.mock.calls[0];
    expect(call[1].headers).not.toHaveProperty('Authorization');
  });
});
