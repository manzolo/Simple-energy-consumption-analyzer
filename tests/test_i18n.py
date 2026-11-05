"""Every t('key') / T('key') used by pages exists, in both languages, and the default is Italian."""
import pathlib
import re
import unittest

from app.i18n import S, LANGS, DEFAULT, table

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'app'


def used_keys():
    keys = set()
    for p in list(ROOT.rglob('*.html')) + list((ROOT / 'static' / 'js').rglob('*.js')):
        if 'vendor' in p.parts:
            continue
        keys |= set(re.findall(r"\b[tT]\('([a-z0-9_]+)'", p.read_text(encoding='utf-8')))
    return keys


class I18n(unittest.TestCase):
    def test_default_is_italian(self):
        self.assertEqual(DEFAULT, 'it')
        self.assertEqual(table('it')['nav_readings'], 'Letture')
        self.assertEqual(table('en')['nav_readings'], 'Readings')
        self.assertEqual(table('xx')['nav_readings'], 'Letture')

    def test_every_used_key_is_defined(self):
        used = used_keys()
        self.assertGreater(len(used), 50)
        self.assertEqual(sorted(used - set(S)), [])

    def test_both_languages_filled_and_placeholders_match(self):
        for k, v in S.items():
            self.assertEqual(len(v), len(LANGS), k)
            self.assertTrue(all(v), k)
            ph = [sorted(re.findall(r'\{(\w+)\}', x)) for x in v]
            self.assertEqual(ph[0], ph[1], k)


if __name__ == '__main__':
    unittest.main()
