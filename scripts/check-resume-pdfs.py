"""Check generated PDF text and links against the corresponding Markdown (pypdf)."""
import re
import unicodedata
from pathlib import Path

from pypdf import PdfReader

root = Path(__file__).resolve().parents[1] / 'public'

def compact(text):
    return ''.join(unicodedata.normalize('NFKC', text).split())

roles = {'ru': 'Руководитель IT-проектов', 'en': 'Technical Project Manager', 'kk': 'IT жобаларының жетекшісі'}
for locale, role in roles.items():
    markdown = (root / f'resume.{locale}.md').read_text(encoding='utf-8')
    pdf = PdfReader(root / f'resume.{locale}.pdf')
    assert pdf.trailer['/Root']['/Lang'] == locale, locale
    text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
    assert compact(role) in compact(text), (locale, 'wrong role/language')
    assert '\ufffd' not in text, (locale, 'unreadable character')
    if locale == 'kk':
        assert 'тәжірибе' in text and 'және' in text, 'Kazakh character mapping'
    for line in markdown.splitlines():
        line = re.sub(r'^(#{1,4} |- )', '', line)
        line = re.sub(r'\[([^\]]+)\]\(https://[^)]+\)', r'\1', line)
        assert compact(line) in compact(text), (locale, 'missing content', line)
    links = set()
    for page in pdf.pages:
        for annotation in page.get('/Annots', []):
            action = annotation.get_object().get('/A', {})
            if action.get('/URI'):
                links.add(str(action['/URI']))
    assert set(re.findall(r'\]\((https://[^)]+)\)', markdown)) <= links, (locale, 'missing link')
    print(f'{locale}: {len(pdf.pages)} pages, all Markdown text and links present')
