import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from challenge_sequence_validation import challenge_sequence_flags, validate_challenge_sequences


def obj(x, y, **properties):
    return {'x':x*32,'y':y*32,'width':32,'height':32,'properties':[{'name':key,'value':value} for key,value in properties.items()]}


class ChallengeSequenceValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.sequence = {'id':'league','name':'League','version':1,'requiredFlags':['restored'],'requiredBadgeIds':['badge_test'], 'activeFlag':'league_active','pendingBattleFlag':'league_pending','completedFlag':'champion','completionEvent':'league/won','memberMapIds':['test/room'],'checkpoint':{'mapId':'test/lobby','spawnId':'arrival'},'servicePolicy':{'healing':'forbidden','storage':'forbidden','battleItems':'allowed'},'stages':[{'id':'first','trainerId':'test/leader','mapId':'test/room','spawnId':'arrival','attemptWonFlag':'first_won','firstRewardFlag':'first_paid','battleOnceFlag':'first_once'}]}
        self.maps = {f'test/{name}':{'id':f'test/{name}','tiledAsset':f'tilemaps/{name}.tmj','spawns':[{'id':'arrival','x':1,'y':2}]} for name in ['room','lobby']}
        self.tiled = {'width':5,'height':5,'layers':[{'name':'collision','objects':[obj(2,2)]},{'name':'characters','objects':[obj(2,2,kind='npc',challengeId='league',challengeStageId='first',trainerId='test/leader')]},{'name':'interactions','objects':[]},{'name':'triggers','objects':[obj(0,2,kind='map-exit',destinationMapId='test/lobby',destinationSpawnId='arrival')]}]}
        self.trainers = {'test/leader':{'battleOnceFlag':'first_once','team':[{'speciesId':1,'level':5,'moveIds':['tackle']}]}}
        self.species = {'1':{'officialLearnset':[{'level':1,'moveId':'tackle'}]}}
        self.quest = {'steps':[{'setFlag':'champion','trigger':'league/won'}]}

    def write(self):
        for path,data in [('content/challenges/league.sequence.json',self.sequence),('content/quests/champion.quest.json',self.quest),('public/tilemaps/room.tmj',self.tiled),('public/tilemaps/lobby.tmj',{'width':5,'height':5,'layers':[]})]:
            target=self.root/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(data),encoding='utf-8')

    def validate(self):
        self.write()
        validate_challenge_sequences(self.root,self.maps,{'restored','champion'},{'league/won'},{'badge_test':{}},self.trainers,self.species,{'tackle':{}})

    def test_valid_ephemeral_stage_has_no_quest_event_and_does_not_mutate(self):
        before=copy.deepcopy(self.sequence);self.validate();self.assertEqual(before,self.sequence)
        self.assertEqual(challenge_sequence_flags(self.root,{'restored','champion'}),{'league_active','league_pending','first_won','first_paid','first_once'})

    def test_owned_flag_cannot_shadow_quest(self):
        self.sequence['activeFlag']='restored'
        with self.assertRaisesRegex(AssertionError,'requirements overlap|overlap quest'):self.validate()

    def test_duplicate_owned_flags(self):
        self.sequence['pendingBattleFlag']='first_paid'
        with self.assertRaisesRegex(AssertionError,'Duplicate challenge flags'):self.validate()

    def test_unknown_badge(self):
        self.sequence['requiredBadgeIds']=['missing']
        with self.assertRaisesRegex(AssertionError,'badge ID'):self.validate()

    def test_wrong_completion_pair(self):
        self.quest['steps'][0]['trigger']='another/event'
        with self.assertRaisesRegex(AssertionError,'must set completedFlag'):self.validate()

    def test_checkpoint_inside_challenge(self):
        self.sequence['checkpoint']['mapId']='test/room'
        with self.assertRaisesRegex(AssertionError,'outside member'):self.validate()

    def test_checkpoint_spawn_missing(self):
        self.sequence['checkpoint']['spawnId']='missing'
        with self.assertRaisesRegex(AssertionError,'Unknown challenge spawn'):self.validate()

    def test_unsafe_stage_spawn(self):
        self.maps['test/room']['spawns'][0].update(x=2,y=2)
        with self.assertRaisesRegex(AssertionError,'safe walkable'):self.validate()

    def test_stage_spawn_on_portal(self):
        self.maps['test/room']['spawns'][0].update(x=0,y=2)
        with self.assertRaisesRegex(AssertionError,'overlaps portal'):self.validate()

    def test_npc_stage_mismatch(self):
        self.tiled['layers'][1]['objects'][0]['properties'][2]['value']='missing'
        with self.assertRaisesRegex(AssertionError,'mismatched challenge stage'):self.validate()

    def test_trainer_lock_mismatch(self):
        self.trainers['test/leader']['battleOnceFlag']='other'
        with self.assertRaisesRegex(AssertionError,'battleOnceFlag mismatch'):self.validate()

    def test_no_return_exit(self):
        self.tiled['layers'][3]['objects']=[]
        with self.assertRaisesRegex(AssertionError,'return exit'):self.validate()

    def test_forbidden_services(self):
        for service in ['pokemon_center','rest_point','storage','monorail']:
            with self.subTest(service=service):
                self.tiled['layers'][2]['objects']=[obj(3,3,serviceId=service)]
                with self.assertRaisesRegex(AssertionError,'Forbidden healing'):self.validate()

    def test_level_illegal_move(self):
        self.species['1']['officialLearnset'][0]['level']=6
        with self.assertRaisesRegex(AssertionError,'level-illegal'):self.validate()

    def test_duplicate_sequence_identity(self):
        self.write();target=self.root/'content/challenges/duplicate.sequence.json';target.write_text(json.dumps(self.sequence),encoding='utf-8')
        with self.assertRaisesRegex(AssertionError,'Duplicate challenge sequence'):challenge_sequence_flags(self.root,{'restored','champion'})

if __name__=='__main__':unittest.main()
