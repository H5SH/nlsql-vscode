import sys
import json
import traceback

# Setup paths to ensure we can load utils relative to agent.py
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.config import parse_config
from utils.llm_init import init_vanna

def respond(msg_type, data=None, error=None):
    res = {"type": msg_type}
    if data is not None:
        res["data"] = data
    if error is not None:
        res["error"] = error
    sys.stdout.write(json.dumps(res) + "\n")
    sys.stdout.flush()

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
                vn = init_vanna(config)
                
                # generate SQL based on the prompt
                prompt = query
                if hasattr(vn, 'system_message'):
                    prompt = f"{vn.system_message}\n\nUser Question: {query}"
                    
                sql = vn.generate_sql(question=prompt)
                
                # execute SQL natively using pandas/sqlalchemy within Vanna setup
                df = vn.run_sql(sql)
                
                # convert dataframe to dict
                results = df.to_dict(orient="records") if not df.empty else []
                
                respond("response", data={"sql": sql, "results": results})
                
            except Exception as e:
                import traceback
                error_msg = traceback.format_exc()
                respond("error", error=f"{str(e)}\n\n{error_msg}")

if __name__ == "__main__":
    main()
