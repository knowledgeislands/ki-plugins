#!/usr/bin/env bun
/** Explicit local-development entry point for project-local skill links. */
import { runProjectLinks } from './project-links.ts'

const argv = process.argv.slice(2)
if (!argv.includes('--check') && !argv.includes('--development')) {
  console.error('link-skills.ts only creates links in explicit local development mode; pass --development or run copy-skills.ts')
  process.exit(2)
}

process.exit(
  runProjectLinks(
    'skills',
    argv.includes('--check') ? 'copy' : 'development-link',
    argv.filter((arg) => arg !== '--development')
  )
)
