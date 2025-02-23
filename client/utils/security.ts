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
