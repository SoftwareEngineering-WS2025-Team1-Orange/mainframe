import { Rule } from '@/utils/validaton/types';

export async function validateRules<P, F>(
  previous: P,
  future: F,
  ruleset: Rule<P, F>[],
) {
  await Promise.all(
    ruleset.map(async (rule) => {
      const res = rule.condition(previous, future);

      if (res instanceof Promise) {
        return res.then((result) => {
          if (!result) {
            throw rule.onFailure;
          }
          return result;
        });
      }

      if (!res) {
        throw rule.onFailure;
      }

      return res;
    }),
  );
}
