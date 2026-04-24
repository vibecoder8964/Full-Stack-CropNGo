import json
import sys

try:
    with open('logs.json', 'r', encoding='utf-16') as f:
        logs = json.load(f)
    
    for l in logs:
        text = l.get('textPayload', '')
        json_p = l.get('jsonPayload', {})
        req = l.get('httpRequest', {})
        sev = l.get('severity', '')
        
        # if severity is ERROR or status code is 500
        if 'startup' in text.lower() or 'warning' in text.lower() or 'error' in text.lower():
            print(f"[{sev}] {text} {json_p} (Status: {req.get('status')})")
except Exception as e:
    print(f"Script error: {e}")
