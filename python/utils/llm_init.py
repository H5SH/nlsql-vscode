import os
from vanna.chromadb import ChromaDB_VectorStore

def init_vanna(config_raw):
    from utils.config import parse_config
    c = parse_config(config_raw)
    
    raw_model = c["model"]
    model = raw_model.lower().strip()
    api_key = c["api_key"]
    use_azure = c["use_azure"]
    endpoint = c["endpoint"]
    sql_url = c["sql_url"]
    
    if not sql_url:
        raise ValueError("Database Connection URL is not provided in Settings.")

    if not model:
        raise ValueError("LLM Model Name is not provided in Settings. Please configure it in the Settings tab (e.g., 'gpt-4o', 'claude-3-sonnet-20240229', etc.).")

    vn = None
    
    # local chroma path to prevent errors
    chroma_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "chroma_db")
    
    # Auto-detect provider based on model name
    if model.startswith("gpt"):
        # Explicit Azure request OR heuristic based on endpoint
        is_azure = use_azure or (endpoint and ("openai.azure.com" in endpoint or "azure" in endpoint.lower()))
        
        if is_azure:
            if not api_key:
                raise ValueError(f"Azure API Key is required for model '{raw_model}'.")
            if not endpoint:
                raise ValueError(f"Azure Endpoint URL is required for model '{raw_model}'.")
                
            from vanna.openai import OpenAI_Chat
            class MyVanna(ChromaDB_VectorStore, OpenAI_Chat): 
                def __init__(self, client, config=None):
                    ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                    OpenAI_Chat.__init__(self, client=client, config=config)
            import openai
            client = openai.AzureOpenAI(api_key=api_key, azure_endpoint=endpoint, api_version="2024-02-01")
            vn = MyVanna(client=client, config={'model': raw_model}) 
        else:
            if not api_key:
                raise ValueError(f"OpenAI API Key is required for model '{raw_model}'.")
            from vanna.openai import OpenAI_Chat
            class MyVanna(ChromaDB_VectorStore, OpenAI_Chat): 
                def __init__(self, config=None):
                    ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                    OpenAI_Chat.__init__(self, config=config)
            vn = MyVanna(config={'api_key': api_key, 'model': raw_model})
            
    elif model.startswith("claude") or "anthropic" in model:
        if not api_key:
            raise ValueError(f"Anthropic API Key is required for model '{raw_model}'.")
        from vanna.anthropic import Anthropic_Chat
        class MyVanna(ChromaDB_VectorStore, Anthropic_Chat): 
            def __init__(self, config=None):
                ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                Anthropic_Chat.__init__(self, config=config)
        vn = MyVanna(config={'api_key': api_key, 'model': raw_model})

    elif model.startswith("gemini") or "google" in model:
        if not api_key:
            raise ValueError(f"Gemini API Key is required for model '{raw_model}'.")
        from vanna.google import GoogleGeminiChat
        class MyVanna(ChromaDB_VectorStore, GoogleGeminiChat): 
            def __init__(self, config=None):
                ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                GoogleGeminiChat.__init__(self, config=config)
        vn = MyVanna(config={'api_key': api_key, 'model': raw_model})

    elif "llama" in model or "mistral" in model or "ollama" in model:
        # Explicit local model request
        from vanna.ollama import Ollama
        class MyVanna(ChromaDB_VectorStore, Ollama): 
            def __init__(self, config=None):
                ChromaDB_VectorStore.__init__(self, config={'path': chroma_path})
                Ollama.__init__(self, config=config)
        vn = MyVanna(config={'model': raw_model or 'llama3'})
    
    else:
        # No match found, don't just default to Ollama if it might be a typo for cloud models
        raise ValueError(f"Unrecognized model provider for '{raw_model}'. Please use a model name starting with 'gpt', 'claude', 'gemini', or 'llama' (for local Ollama).")
        
    if vn is None:
        raise ValueError(f"Unable to initialize model provider for: {raw_model}")

    from utils.db_connection import connect_db
    connect_db(vn, sql_url)
    
    return vn
