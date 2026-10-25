import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from audit_redesign_inventory import possible_narrative_aliases


def appearance(npc_id, identity, speaker, profile=False):
    return dict(npcId=npc_id, identityKey=identity, narrativeSpeaker=speaker,
                mapId='veloria/example', dialogueId=npc_id, profileMatch=profile)


class NarrativeAliasAudit(unittest.TestCase):
    def test_assigning_one_portrait_does_not_hide_unresolved_shared_name(self):
        people = [appearance('nerea_gym', 'profile:gym-nerea', 'Nerea', True),
                  appearance('league_council1', 'npc:league_council1', 'Nerea')]
        aliases = possible_narrative_aliases(people)
        self.assertEqual([row['speaker'] for row in aliases], ['Nerea'])
        self.assertEqual(len(aliases[0]['appearances']), 2)

    def test_explicit_shared_identity_is_not_an_unresolved_alias(self):
        people = [appearance('prof_elia', 'profile:professor-elia', 'Elia', True),
                  appearance('concordia_elia', 'profile:professor-elia', 'Elia', True)]
        self.assertEqual(possible_narrative_aliases(people), [])


if __name__ == '__main__':
    unittest.main()
