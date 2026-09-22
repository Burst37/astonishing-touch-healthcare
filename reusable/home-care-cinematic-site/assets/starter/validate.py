import json,sys
from pathlib import Path
c=json.loads((Path(__file__).parent/'agency.json').read_text())
assert len({s['id'] for s in c['services']})==len(c['services']), 'Duplicate service IDs'
assert all(not s['enabled'] or s['verified'] for s in c['services']), 'Enabled service lacks verification'
if '--launch' in sys.argv:
 assert c['factsVerified'] and c['name']!='Your Agency', 'Confirm agency identity first'
 assert c['phone'] and c['domain'].startswith('https://'), 'Set confirmed phone and domain'
 assert any(s['enabled'] for s in c['services']), 'Confirm at least one service'
 assert all(s['video'] and s['poster'] for s in c['services'] if s['enabled']), 'Supply service media'
print('Configuration valid'+(' for launch review' if '--launch' in sys.argv else ' for template preview'))
