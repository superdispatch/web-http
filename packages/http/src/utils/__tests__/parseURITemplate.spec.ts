import extended from 'uritemplate-test/extended-tests.json';
import examplesBySection from 'uritemplate-test/spec-examples-by-section.json';
import examples from 'uritemplate-test/spec-examples.json';

import { parseURITemplate } from '../parseURITemplate';

const specs = [
  ['Examples', examples],
  ['Examples By Section', examplesBySection],
  ['Extended', extended],
] as const;

for (const [description, spec] of specs) {
  describe(description, () => {
    for (const [title, { variables, testcases }] of Object.entries(spec)) {
      for (const [template, expected] of testcases) {
        test(`${title}: ${template as string}`, () => {
          const output = parseURITemplate(template as string, variables);

          if (typeof expected === 'string') {
            expect(output).toBe(expected);
          } else {
            expect(expected).toContain(output);
          }
        });
      }
    }
  });
}
