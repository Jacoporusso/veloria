"""Validation for optional declarative narrative choices."""
def validate_dialogue_choices(dialogues, quest_flags, quest_triggers):
    def check(condition, message):
        if not condition:
            raise AssertionError(message)
    def text(value):
        return isinstance(value, str) and bool(value.strip())
    for dialogue_id, entry in dialogues.items():
        for stage in [entry, *entry.get('stages', [])]:
            choices = stage.get('choices')
            if choices is None:
                continue
            check(isinstance(choices, list) and 1 <= len(choices) <= 6, f'Invalid dialogue choices: {dialogue_id}')
            check(not stage.get('requiresStarterChoice'), f'Starter and narrative choices conflict: {dialogue_id}')
            check('choicePrompt' not in stage or text(stage['choicePrompt']), f'Invalid choice prompt: {dialogue_id}')
            ids = []
            for choice in choices:
                check(isinstance(choice, dict) and text(choice.get('id')) and text(choice.get('label')), f'Invalid dialogue choice: {dialogue_id}')
                ids.append(choice['id'])
                check(isinstance(choice.get('lines'), list) and choice['lines'] and all(text(line) for line in choice['lines']), f'Choice needs response lines: {dialogue_id}')
                if 'questEvent' in choice:
                    check(choice['questEvent'] in quest_triggers, f'Unknown choice quest event: {dialogue_id}')
                flags = choice.get('requiresFlags', [])
                check(isinstance(flags, list) and all(text(flag) for flag in flags) and len(flags) == len(set(flags)) and set(flags) <= set(quest_flags), f'Unknown or invalid choice flags: {dialogue_id}')
            check(len(ids) == len(set(ids)), f'Duplicate dialogue choice ID: {dialogue_id}')
