export const isProcessSkill = (description: string): boolean => /\(kind:\s*process\b/i.test(description)

export const hintVerbs = (hint: string): string[] =>
  hint
    .split('|')
    .map((segment) =>
      segment
        .trim()
        .match(/^[a-zA-Z][a-zA-Z0-9-]*/)?.[0]
        ?.toUpperCase()
    )
    .filter((verb): verb is string => verb !== undefined)
