
from llama_index.core.query_engine import NLSQLTableQueryEngine
from sqlalchemy import create_engine
from llama_index.core import SQLDatabase



class OpenSQLAgent:

    def __init__(self, db:str):
        self.db = db

    def __init_engine(self):
       self.engine = create_engine(self.db)

    def __init_database(self): 
        self.database = SQLDatabase(self.engine)

    def get_agent(self, llm):
        self.__init_engine()
        self.__init_database()
        return NLSQLTableQueryEngine(self.database, llm=llm, embed_model='local', markdown_response=True)