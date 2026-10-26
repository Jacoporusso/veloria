import unittest
from tools.localized_text_validation import repair_mojibake


class LocalizedTextTests(unittest.TestCase):
    def test_repairs_corrupted_apostrophes_and_accents_without_touching_valid_text(self):
        expected = 'È il momento: Pokémon, l’acqua è pronta · Città'
        corrupted = expected.encode('utf-8').decode('cp1252')
        self.assertEqual(repair_mojibake(corrupted), expected)
        self.assertEqual(repair_mojibake(expected), expected)

    def test_repairs_mixed_text_and_is_idempotent(self):
        corrupted = 'Pokémon: l’acqua'.replace('’', '’'.encode('utf-8').decode('cp1252'))
        fixed = repair_mojibake(corrupted)
        self.assertEqual(fixed, 'Pokémon: l’acqua')
        self.assertEqual(repair_mojibake(fixed), fixed)
