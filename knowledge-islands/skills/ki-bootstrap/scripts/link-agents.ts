#!/usr/bin/env bun
/** Compatibility entry point for the project-local Claude agents linker. */
import { runProjectLinks } from './project-links.ts'

process.exit(runProjectLinks('agents'))
