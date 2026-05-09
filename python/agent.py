import sys
import json
import traceback
import re

# Setup paths to ensure we can load utils relative to agent.py
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.llm_init import init_vanna

def respond(msg_type, data=None, error=None):
    res = {"type": msg_type}
    if data is not None:
        res["data"] = data
    if error is not None:
        res["error"] = error
    sys.stdout.write(json.dumps(res) + "\n")
    sys.stdout.flush()

def is_sql(text):
    """Simple heuristic to check if a response is likely SQL."""
    # Remove markdown code blocks if present
    clean_text = re.sub(r"```sql|```", "", text).strip()
    # Check for common SQL keywords at the start
    sql_keywords = r"^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|SHOW|DESCRIBE|EXPLAIN)\b"
    return re.match(sql_keywords, clean_text, re.IGNORECASE) is not None

def is_ddl_dml(text):
    """Check if the SQL query is a DDL or DML command (usually doesn't return results)."""
    clean_text = re.sub(r"```sql|```", "", text).strip()
    ddl_dml_keywords = r"^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|REPLACE|GRANT|REVOKE)\b"
    return re.match(ddl_dml_keywords, clean_text, re.IGNORECASE) is not None

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
                
                # Generate the response from Vanna
                response_text = vn.generate_sql(question=query)
                
                # Clean up markdown if model wrapped it in backticks
                sql_match = re.search(r"```sql\s*(.*?)\s*```", response_text, re.DOTALL | re.IGNORECASE)
                if sql_match:
                    sql_query = sql_match.group(1).strip()
                else:
                    sql_query = response_text.strip()

                # If it looks like SQL, try to run it
                if is_sql(sql_query):
                    try:
                        is_execution = is_ddl_dml(sql_query)
                        df = vn.run_sql(sql_query)
                        results = df.to_dict(orient="records") if not df.empty else []
                        respond("response", data={"sql": sql_query, "results": results, "is_execution": is_execution})
                    except Exception as db_err:
                        # If execution fails, return the SQL but also the specific DB error (not full traceback)
                        respond("response", data={"sql": sql_query, "error": str(db_err)})
                else:
                    # It's a conversational response, return it as message text
                    respond("response", data={"message": response_text})
                
            except Exception as e:
                # Top level error (initialization or generation failed)
                # Return only the main error message to keep UI clean
                respond("error", error=str(e))

if __name__ == "__main__":
    main()
