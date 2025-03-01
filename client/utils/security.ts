import * as JSONBigInt from "json-bigint";

// Enhanced security patterns
const SENSITIVE_PATTERNS = [
  /password/i,
  /passwd/i,
  /credit.?card/i,
  /card.?number/i,
  /ssn|social.?security/i,
  /otp|2fa|mfa/i,
  /secret/i,
  /key/i,
  /token/i,
  /auth/i,
  /pin/i,
  /cvv/i,
];

// Safe fetch wrapper with timeout and error handling
export const safeFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw new Error(
      `Request failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export function isSensitiveField(element: HTMLElement): boolean {
  const attributes = [
    element.id,
    element.className,
    element.getAttribute("name"),
    element.getAttribute("placeholder"),
    element.getAttribute("autocomplete"),
    element.getAttribute("aria-label"),
    element.getAttribute("data-testid"),
  ];

  // Check if any attribute matches sensitive patterns
  return SENSITIVE_PATTERNS.some((pattern) =>
    attributes.some((attr) => attr && pattern.test(attr))
  );
}
