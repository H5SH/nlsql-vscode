import os
from vanna.chromadb import ChromaDB_VectorStore

def init_vanna(config_raw):
    from utils.config import parse_config
    c = parse_config(config_raw)
    model = c["model"].lower()
    api_key = c["api_key"]
    endpoint = c["endpoint"]
    sql_url = c["sql_url"]
    
    if not sql_url:
        raise ValueError("SQL Connection URL is required")

    vn = None
    
    # local chroma path to prevent errors
    chroma_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "chroma_db")
    
    # Auto-detect provider based on model name
    if model.startswith("gpt"):
        # Could be Azure or standard OpenAI. Use endpoint presence to decide if Azure
        if endpoint and "openai.azure.com" in endpoint:
            if not api_key:
                raise ValueError("Azure API Key is required")
            from vanna.openai import OpenAI_Chat
            class MyVanna(ChromaDB_VectorStore, OpenAI_Chat): 
                def __init__(self, client, config=None):
                    ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                    OpenAI_Chat.__init__(self, client=client, config=config)
            import openai
            client = openai.AzureOpenAI(api_key=api_key, azure_endpoint=endpoint, api_version="2024-02-01")
            vn = MyVanna(client=client, config={'model': c["model"]}) 
        else:
            if not api_key:
                raise ValueError("OpenAI API Key is required")
            from vanna.openai import OpenAI_Chat
            class MyVanna(ChromaDB_VectorStore, OpenAI_Chat): 
                def __init__(self, config=None):
                    ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                    OpenAI_Chat.__init__(self, config=config)
            vn = MyVanna(config={'api_key': api_key, 'model': c["model"]})
            
    elif model.startswith("claude"):
        if not api_key:
            raise ValueError("Anthropic API Key is required")
        from vanna.anthropic import Anthropic_Chat
        class MyVanna(ChromaDB_VectorStore, Anthropic_Chat): 
            def __init__(self, config=None):
                ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                Anthropic_Chat.__init__(self, config=config)
        vn = MyVanna(config={'api_key': api_key, 'model': c["model"]})

    elif model.startswith("gemini"):
        if not api_key:
            raise ValueError("Gemini API Key is required")
        from vanna.google import GoogleGeminiChat
        class MyVanna(ChromaDB_VectorStore, GoogleGeminiChat): 
            def __init__(self, config=None):
                ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                GoogleGeminiChat.__init__(self, config=config)
        vn = MyVanna(config={'api_key': api_key, 'model': c["model"]})

    else:
        # Fallback to Ollama or custom local model using endpoint
        from vanna.ollama import Ollama
        class MyVanna(ChromaDB_VectorStore, Ollama): 
            def __init__(self, config=None):
                ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                Ollama.__init__(self, config=config)
        vn = MyVanna(config={'model': c["model"] or 'llama3'})
        
    if vn is None:
        raise ValueError(f"Unable to initialize model provider for: {c['model']}")

    from utils.db_connection import connect_db
    connect_db(vn, sql_url)
    
    return vn
