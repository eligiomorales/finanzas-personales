/** Normalize keyword for storage and matching (trim + lowercase). */
export function normalizeRuleKeyword(keyword: string): string {
  return keyword.trim().toLowerCase()
}

export function ruleKeywordMatchesDescription(keyword: string, description: string): boolean {
  const normalized = normalizeRuleKeyword(keyword)
  if (!normalized) return false
  return description.toLowerCase().includes(normalized)
}
