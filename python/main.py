import sys
import json
import re

# Setup paths to ensure we can load utils relative to agent.py
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils.utils import respond, handle_response
from utils.agent import OpenSQLAgent
from utils.llm import LLM

def main():
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        
        if msg.get("type") == "ask":
            query = msg.get("query")
            config = msg.get("config", {})
            try:
                agent = OpenSQLAgent(config.get('sqlConnectionUrl'))   
                llm = LLM(config)
                agent = agent.get_agent(llm)
                response = handle_response(agent, query)
                
                respond('response', {'message': str(response), 'sql': response.metadata.get('sql_query', '')})             
            except Exception as e:
                # Top level error (initialization or generation failed)
                # Return only the main error message to keep UI clean
                respond("error", error=str(e))

if __name__ == "__main__":
    main()
