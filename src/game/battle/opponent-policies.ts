import data from '../../../content/battle/opponent-policies.v1.json';
import type { OpponentPolicy } from '../../core/battle/opponent-policy.ts';

export const opponentPolicies = data.profiles as Readonly<Record<string, OpponentPolicy>>;
export function getOpponentPolicy(id = 'wild'): OpponentPolicy {
  const policy = opponentPolicies[id];
  if (!policy) throw new Error('Unknown opponent policy: ' + id);
  return policy;
}
