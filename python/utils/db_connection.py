def connect_db(vn, sql_url):
    """
    Connects the pre-initialized Vanna instance to the DB specified by sql_url.
    Vanna provides run_sql wrapper for sqlalchemy via set_engine or similar.
    """
    if vn is None:
        raise ValueError("Vanna instance is None")

    import sqlalchemy
    import pandas as pd
    
    # Alternatively we can let vanna manage it.
    # Vanna often provides `vn.connect_to_postgres` but standard way is `vn.run_sql` via sqlalchemy
    # We will override `vn.run_sql` manually to be safe across all SQL dialects if standard api is missing.

    engine = sqlalchemy.create_engine(sql_url)
    
    def run_sql(sql: str) -> pd.DataFrame:
        with engine.connect() as conn:
            # Use execute instead of read_sql to handle non-SELECT statements
            result = conn.execute(sqlalchemy.text(sql))
            # Commit changes for DDL/DML
            conn.commit()
            
            if result.returns_rows:
                return pd.DataFrame(result.fetchall(), columns=result.keys())
            else:
                # Return empty dataframe for success on non-SELECT queries
                return pd.DataFrame()
            
    # override run_sql logic
    vn.run_sql_is_set = True
    vn.run_sql = run_sql

    # Also extract schema if we want vanna to know what to query
    # Simple reflection:
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        schema_info = []
        for table_name in inspector.get_table_names():
            columns = inspector.get_columns(table_name)
            col_info = [col["name"] for col in columns]
            schema_info.append(f"Table {table_name}: " + ", ".join(col_info))
        
        # Inject context for generating SQL
        system_msg_text = (
            "You are a database expert. Your goal is to provide ONLY a valid SQL query in response to the user's question. "
            "Do not provide any explanations, greetings, or additional text. If the user asks something that is not related "
            "to querying the database, politely state that you can only assist with SQL generation. "
            "The database schema has these tables: \n" + "\n".join(schema_info)
        )
        vn.system_message = lambda initial_prompt: {"role": "system", "content": system_msg_text}
    except Exception as e:
        print(f"Warning: could not inspect db - {str(e)}")
