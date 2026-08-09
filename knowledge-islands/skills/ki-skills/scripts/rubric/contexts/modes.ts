export const isProcessSkill = (kind: string): boolean => kind === 'process'

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
