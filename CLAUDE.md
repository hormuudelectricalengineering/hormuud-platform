# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm run build` - Build all workspaces using Turbo
- `npm run dev` - Start development servers for all workspaces
- `npm run lint` - Lint all workspaces
- `npm run test` - Run tests across all workspaces
- `npm run supabase` - Manage Supabase services

## Architecture

Monorepo managed by npm workspaces (`apps/*`) and Turborepo. Applications live in `apps/`. Turbo orchestrates builds, linting, and tests with caching and parallelization. Supabase provides backend services (database, auth, etc.).
