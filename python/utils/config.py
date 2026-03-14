def parse_config(config_dict):
    # Validates and defaults config mapping
    return {
        "provider": config_dict.get("provider", "OpenAI"),
        "api_key": config_dict.get("apiKey", ""),
        "endpoint": config_dict.get("endpoint", ""),
        "sql_url": config_dict.get("sqlConnectionUrl", "")
    }
