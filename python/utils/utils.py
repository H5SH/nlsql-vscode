from llama_index.core.query_engine import NLSQLTableQueryEngine
from typing import Literal, TypedDict
import sys
import json

def handle_response(agent: NLSQLTableQueryEngine, query: str)-> str:
    response = agent.query(query)
    return response

class ResponseType(TypedDict):
    sql: str
    results: str
    is_execution: bool
    error: str
    message: str

def respond(msg_type: Literal['response', 'error'], data: ResponseType):
    res = {"type": msg_type}
    if data is not None:
        res["data"] = data
    sys.stdout.write(json.dumps(res) + "\n")
    sys.stdout.flush()