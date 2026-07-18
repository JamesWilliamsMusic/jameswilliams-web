import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { ReactElement } from 'react';

type AxeResults = Awaited<ReturnType<typeof axe>>;

expect.extend(toHaveNoViolations);

export interface A11yTestOptions {
  /** axe-core rules to disable for this test */
  disabledRules?: string[];
}

export async function renderAndCheckA11y(
  ui: ReactElement,
  options: A11yTestOptions = {}
): Promise<AxeResults> {
  const { container } = render(ui);

  const axeOptions: Parameters<typeof axe>[1] = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  };

  if (options.disabledRules?.length) {
    axeOptions.rules = Object.fromEntries(
      options.disabledRules.map((rule) => [rule, { enabled: false }])
    );
  }

  const results = await axe(container, axeOptions);
  expect(results).toHaveNoViolations();
  return results;
}
