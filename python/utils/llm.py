from typing import TypedDict
from llama_index.llms.openai import OpenAI
from llama_index.llms.anthropic import Anthropic
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.llms.azure_openai import AzureOpenAI


class ConfigType(TypedDict):
    model: str
    api_key: str
    use_azure:str
    endpoint: str

class LLM:
    def __new__(cls, config: ConfigType):
       name = config.get('model', '')
       api_key = config['apiKey']
       endpoint = config.get('endpoint', None)
       if name.startswith('gpt'):
           is_azure = config.get('useAzure', False)
           if is_azure:
               return AzureOpenAI(
                   azure_endpoint=endpoint,
                   azure_deployment=name,
                   api_key=api_key,
                   api_version='2025-01-01-preview',
                   temperature=1
               ) 
           return OpenAI(
               model=name,
               api_key=api_key
           )
       
       elif name.startswith('gemini'):
           return GoogleGenAI(
               model=name,
               api_key=api_key,
           )
       
       return Anthropic(
           base_url=endpoint,
           model=name,
           api_key=api_key
       )