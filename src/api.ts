export const fetchJson = async <T>(
  input: string | URL,
  init: RequestInit,
  errorContext: string
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(
      `${errorContext}: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
};
