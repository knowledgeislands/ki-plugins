export const containsXmlTag = (value: string): boolean => /<\/?[a-zA-Z][^>]*>/.test(value)

export const stripCode = (markdown: string): string => markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
