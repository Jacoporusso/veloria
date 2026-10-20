import copy,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from transit_validation import validate_local_transports
class LocalTransportValidationTests(unittest.TestCase):
 def setUp(self):
  self.networks=[json.loads(p.read_text(encoding='utf-8')) for p in (ROOT/'content/transit').glob('*.transport.json')]
  self.maps={m['id']:m for p in (ROOT/'content/maps').glob('*.map.json') for m in [json.loads(p.read_text(encoding='utf-8'))]}
  self.tiled={mid:json.loads((ROOT/'public'/m['tiledAsset']).read_text(encoding='utf-8')) for mid,m in self.maps.items()}
  self.flags={s['setFlag'] for p in (ROOT/'content/quests').glob('*.quest.json') for q in [json.loads(p.read_text(encoding='utf-8'))] for s in q['steps']}
 def validate(self):validate_local_transports(self.networks,self.maps,self.tiled,self.flags)
 def test_actual_networks_and_arrivals(self):
  before=copy.deepcopy(self.networks);self.validate();self.assertEqual(before,self.networks)
 def test_unknown_flag(self):
  self.networks[0]['requiredFlags']=['missing'];
  with self.assertRaisesRegex(AssertionError,'required flag'):self.validate()
 def test_unknown_route(self):
  self.networks[0]['routes'][0]['toStopId']='missing'
  with self.assertRaisesRegex(AssertionError,'route'):self.validate()
 def test_unsafe_arrival(self):
  self.maps['veloria/passobrina']['spawns'][-1]['x']=29
  spawn=next(s for s in self.maps['veloria/passobrina']['spawns'] if s['id']=='cable_arrival');spawn['y']=21
  with self.assertRaisesRegex(AssertionError,'adjacent terminal'):self.validate()
 def test_missing_terminal_collision(self):
  t=self.tiled['veloria/biancavetta'];next(l for l in t['layers'] if l['name']=='collision')['objects']=[]
  with self.assertRaisesRegex(AssertionError,'full collision'):self.validate()
if __name__=='__main__':unittest.main()
