# Linting Setup

This document describes the linting infrastructure implemented for the Family Planner project.

## Overview

Automated code linting has been configured for all TypeScript code in the monorepo to enforce code quality standards and catch errors early.

## Tools Installed

- **ESLint**: Primary linting tool for JavaScript/TypeScript
- **@typescript-eslint/parser** & **@typescript-eslint/eslint-plugin**: TypeScript-specific linting rules
- **eslint-plugin-react** & **eslint-plugin-react-hooks**: React-specific linting rules (frontend only)
- **husky**: Git hooks manager for pre-commit automation
- **lint-staged**: Runs linters on staged files only

## Configuration Files

### Backend: `backend/eslint.config.mjs`
- Lints all `.ts` files in `src/` and `tests/`
- TypeScript-specific rules enabled
- Configured to ignore `dist/`, `node_modules/`, and `drizzle/` directories

### Frontend: `frontend/eslint.config.mjs`
- Lints all `.ts` and `.tsx` files
- TypeScript + React + React Hooks rules enabled
- Configured to ignore `.expo/`, `dist/`, and `node_modules/` directories

## Scripts

### Root Level
```bash
pnpm run lint         # Run linters across all workspaces
pnpm run lint:fix     # Auto-fix linting issues across all workspaces
```

### Backend
```bash
pnpm --filter backend lint        # Lint backend code
pnpm --filter backend lint:fix    # Auto-fix backend issues
```

### Frontend
```bash
pnpm --filter frontend lint       # Lint frontend code
pnpm --filter frontend lint:fix   # Auto-fix frontend issues
```

## Pre-Commit Hooks

Husky is configured to automatically run `lint-staged` before every commit. This ensures:
- Only staged files are linted (fast)
- Auto-fix is attempted for common issues
- Commits are blocked if linting errors remain

### Configuration
Located in `package.json` under `lint-staged`:
```json
{
  "lint-staged": {
    "backend/**/*.ts": [
      "npm run lint:fix --workspace=backend"
    ],
    "frontend/**/*.{ts,tsx}": [
      "npm run lint:fix --workspace=frontend"
    ]
  }
}
```

## CI/CD Integration

The linting step should be added to CI/CD pipelines:
```bash
npm run lint
```

This will fail the build if linting errors are found, ensuring code quality standards are maintained.

## Common Linting Rules

### Errors (Will block commits)
- Unused variables (except those prefixed with `_`)
- Use of `@ts-ignore` (use `@ts-expect-error` instead)
- Undefined variables

### Warnings (Allowed but should be addressed)
- Use of `any` type (specify proper types)
- Console statements in production code
- Unescaped entities in React

## Fixing Linting Issues

1. **Auto-fix**: Run `npm run lint:fix` to automatically fix many issues
2. **Manual fixes**: Address remaining errors and warnings manually
3. **Suppress warnings**: If necessary, use `eslint-disable-next-line` with justification
4. **Update rules**: Modify `eslint.config.mjs` if team decides to relax/strengthen rules

## Bypassing Pre-Commit Hooks

In rare cases where you need to commit without linting:
```bash
git commit --no-verify
```

**Note**: This should only be used in exceptional circumstances and with proper justification.

## Maintenance

- Review and update ESLint configurations periodically
- Keep ESLint and plugin versions up to date
- Address deprecated rules as they arise
- Adjust rules based on team feedback and project needs
