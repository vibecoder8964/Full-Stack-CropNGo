import traceback
from main import process_agent_request

payload = {
  "description": "Small-scale vegetable farmer in Perak",
  "role": "Farmer",
  "web_search": True,
  "question": "What is the current market price for organic fertilizers in the mock database?"
}

try:
    print(process_agent_request(payload))
except Exception as e:
    traceback.print_exc()
