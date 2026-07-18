# Implementation Plan: Accessibility Pipeline Tests

## Overview

Add automated WCAG 2.1 Level AA accessibility testing to the CI/CD pipeline using jest-axe. This involves installing dependencies, creating shared test helpers and fixtures, writing per-route accessibility test files, adding an npm script, and integrating the test step into the GitHub Actions quality job.

## Tasks

- [ ] 1. Install dependencies and add npm script
  - [ ] 1.1 Install jest-axe and @types/jest-axe as dev dependencies
    - Run `npm install --save-dev jest-axe @types/jest-axe` to add axe-core testing support
    - Verify the packages appear in `package.json` devDependencies
    - _Requirements: 3.1_

  - [ ] 1.2 Add the `test:a11y` npm script to package.json
    - Add `"test:a11y": "jest --testPathPattern=tests/accessibility --passWithNoTests"` to the scripts section
    - _Requirements: 4.1, 4.2_

- [ ] 2. Create shared test infrastructure
  - [ ] 2.1 Create `tests/accessibility/helpers.ts` with the `renderAndCheckA11y` utility
    - Implement the shared helper that renders a React element, runs axe-core with WCAG 2.1 AA tags, and asserts no violations
    - Include the `A11yTestOptions` interface with `disabledRules` support for rule overrides
    - Extend Jest expect with `toHaveNoViolations` matcher
    - Configure axe to target `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` rule tags
    - _Requirements: 1.1, 3.2, 3.3_

  - [ ] 2.2 Create `tests/accessibility/fixtures/webiny.ts` with mock CMS data
    - Define mock responses for `getHero`, `getTourDates`, `getExclusiveContent`, and other Webiny API calls
    - Export typed fixture objects matching the existing Webiny API response types
    - _Requirements: 1.1, 1.2_

- [ ] 3. Implement page route accessibility tests
  - [ ] 3.1 Create `tests/accessibility/homepage.a11y.test.tsx`
    - Mock `@/lib/webiny/api` to return fixture data for hero, tour dates, and content sections
    - Render the homepage component and validate with `renderAndCheckA11y`
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.2 Create `tests/accessibility/login.a11y.test.tsx`
    - Mock `next/navigation` for router hooks used by the login client component
    - Render the login page and validate with `renderAndCheckA11y`
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.3 Create `tests/accessibility/signup.a11y.test.tsx`
    - Mock `next/navigation` for router hooks used by the signup client component
    - Render the signup page and validate with `renderAndCheckA11y`
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.4 Create `tests/accessibility/forgot-password.a11y.test.tsx`
    - Mock `next/navigation` for router hooks
    - Render the forgot-password page and validate with `renderAndCheckA11y`
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.5 Create `tests/accessibility/exclusive.a11y.test.tsx`
    - Mock `next/headers` for cookies (auth token)
    - Mock `@/lib/webiny/api` to return exclusive content fixture data
    - Render the exclusive content page and validate with `renderAndCheckA11y`
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 3.6 Create `tests/accessibility/account.a11y.test.tsx`
    - Mock `next/headers` for cookies (auth token)
    - Mock any account-related data fetching dependencies
    - Render the account page and validate with `renderAndCheckA11y`
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 4. Checkpoint - Verify all accessibility tests pass locally
  - Ensure all tests pass by running `npm run test:a11y`, ask the user if questions arise.

- [ ] 5. Integrate into CI/CD pipeline
  - [ ] 5.1 Add `npm run test:a11y` step to the quality job in `.github/workflows/deploy.yml`
    - Insert `- run: npm run test:a11y` after the `npm run test:integration` step
    - This ensures accessibility tests run after unit/integration tests and block deployment on failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 6. Final checkpoint - Ensure full test suite passes
  - Ensure all tests pass (unit, integration, and accessibility), ask the user if questions arise.

## Notes

- No property-based tests are included as the design explicitly identifies this feature as test infrastructure configuration with no meaningful input variation
- Each test file follows the same render-and-check pattern, making it easy to add new routes per Requirement 3.4
- The existing Jest config already covers `tests/accessibility/` via `roots: ['<rootDir>/tests']` — no jest.config.ts changes needed
- Rule overrides use the `disabledRules` option in `renderAndCheckA11y` with mandatory code comments explaining justification
- axe-core violation output automatically includes rule ID, impact, element, and description (Requirements 1.3, 4.4)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 3, "tasks": ["5.1"] }
  ]
}
```
