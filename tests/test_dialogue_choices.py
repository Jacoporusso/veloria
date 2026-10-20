import copy,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from dialogue_validation import validate_dialogue_choices
class DialogueChoiceTests(unittest.TestCase):
 def setUp(self):self.data={'elia':{'speaker':'Elia','stages':[{'lines':['Scelta.'],'choices':[{'id':'restore','label':'Ripristiniamo','lines':['Insieme.'],'questEvent':'restore','requiresFlags':['read']}]}]}}
 def validate(self):validate_dialogue_choices(self.data,{'read'},{'restore'})
 def test_valid_and_no_mutation(self):
  before=copy.deepcopy(self.data);self.validate();self.assertEqual(self.data,before)
 def test_duplicate_choice(self):
  self.data['elia']['stages'][0]['choices']*=2
  with self.assertRaisesRegex(AssertionError,'Duplicate'):self.validate()
 def test_unknown_event(self):
  self.data['elia']['stages'][0]['choices'][0]['questEvent']='missing'
  with self.assertRaisesRegex(AssertionError,'quest event'):self.validate()
 def test_missing_response(self):
  self.data['elia']['stages'][0]['choices'][0]['lines']=[]
  with self.assertRaisesRegex(AssertionError,'response lines'):self.validate()
 def test_unknown_prerequisite(self):
  self.data['elia']['stages'][0]['choices'][0]['requiresFlags']=['missing']
  with self.assertRaisesRegex(AssertionError,'choice flags'):self.validate()
if __name__=='__main__':unittest.main()
