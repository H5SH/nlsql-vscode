# openQL Agent

> Talk to your database in plain English — right inside VS Code.

**openQL Agent** is a VS Code extension that turns natural-language questions into SQL queries and runs them against your database. It is powered by [LlamaIndex](https://www.llamaindex.ai/) and supports OpenAI, Azure OpenAI, Anthropic, and Google Gemini models out of the box.

---

## 🎬 Introduction Video

<!-- INTRO VIDEO PLACEHOLDER -->
<!-- Replace the line below with the embedded video link once recorded. -->
<!-- Example for YouTube: -->
<!-- [![openQL Agent Demo](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID) -->

*A short walkthrough video is coming soon — it will be embedded here.*

---

## ✨ Features

- 💬 **Chat-style interface** — ask questions about your data in natural language.
- 🧠 **Multi-provider LLM support** — OpenAI, Azure OpenAI, Anthropic Claude, and Google Gemini (provider auto-detected from the model name).
- 🗄️ **Works with any SQL database** supported by SQLAlchemy — PostgreSQL, MySQL, Microsoft SQL Server, SQLite, and more.
- 🪄 **Auto-generated SQL** — see the exact query the agent ran along with the answer.
- ⚙️ **Bundled Python runtime** — the extension creates and manages its own Python virtual environment on first launch.
- 🎨 **Native VS Code panel** — lives in the bottom panel as a dedicated webview.

---

## 📦 Installation

1. Open the **Extensions** view in VS Code (`Cmd/Ctrl + Shift + X`).
2. Search for **openQL Agent**.
3. Click **Install**.

**Prerequisites**

- VS Code `1.80.0` or higher.
- **Python 3.9+** available on your system `PATH` (as `python3` on macOS/Linux, `python` on Windows). The extension will use this to bootstrap its own virtual environment on first run.
- Network access to your chosen LLM provider and your database.

---

## 🚀 Getting Started

1. Open the **openQL** tab in the bottom panel (or run `openQL: Open Chat` from the Command Palette).
2. Switch to the **Settings** tab inside the panel and fill in:
   - **Model Name** — e.g. `gpt-4o`, `claude-3-5-sonnet-20241022`, `gemini-1.5-pro`.
   - **API Key** — the key for the chosen provider.
   - **Use Azure OpenAI** — toggle on if you are using Azure-hosted OpenAI models.
   - **Endpoint URL** — required for Azure; optional for other providers.
   - **SQL Connection URL** — a SQLAlchemy-compatible connection string (see examples below).
3. Click **Save Settings**.
4. Switch back to the **Chat** tab and ask a question like *"How many orders were placed last month?"*.

### Example connection strings

| Database          | Example URL                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| PostgreSQL        | `postgresql://user:password@localhost:5432/mydb`                           |
| MySQL             | `mysql+pymysql://user:password@localhost:3306/mydb`                        |
| SQL Server (ODBC) | `mssql+pyodbc://user:password@host/db?driver=ODBC+Driver+17+for+SQL+Server`|
| SQLite            | `sqlite:///absolute/path/to/file.db`                                       |

---

## ⚙️ Extension Settings

This extension contributes the following settings (also editable from the **Settings** tab in the panel):

| Setting                    | Type      | Default  | Description                                                                                  |
| -------------------------- | --------- | -------- | -------------------------------------------------------------------------------------------- |
| `vannaSql.modelName`       | `string`  | `gpt-4o` | The model to use. The provider is auto-detected from the prefix (`gpt`, `claude`, `gemini`). |
| `vannaSql.apiKey`          | `string`  | `""`     | API key for the chosen provider.                                                             |
| `vannaSql.useAzure`        | `boolean` | `false`  | Use Azure OpenAI instead of standard OpenAI (only applies to `gpt` models).                  |
| `vannaSql.endpoint`        | `string`  | `""`     | Endpoint URL. Required for Azure OpenAI; optional otherwise.                                 |
| `vannaSql.sqlConnectionUrl`| `string`  | `""`     | SQLAlchemy-style database connection URL.                                                    |

---

## 🧩 Commands

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `openQL: Open Chat`    | Opens (or focuses) the openQL panel. |

---

## 🛠️ How It Works

The extension ships with a small Python backend (under `python/`) that the VS Code host process spawns on activation:

- `python/main.py` — JSON-over-stdio loop that receives questions from the webview.
- `python/utils/agent.py` — wraps LlamaIndex's `NLSQLTableQueryEngine` around a SQLAlchemy engine.
- `python/utils/llm.py` — instantiates the right LLM client based on the model name.
- `src/pythonRunner.ts` — manages the venv, installs `requirements.txt` on first launch, and pipes messages between Python and the webview.

On first launch the extension will:

1. Create a `python/.venv` virtual environment.
2. Install dependencies from `python/requirements.txt`.
3. Start the long-running Python process.

You can watch the **openQL Agent** output channel in VS Code to see this progress.

---

## 🐞 Troubleshooting

- **"Failed to setup Python environment"** — make sure `python3` (or `python` on Windows) is available on your `PATH` and that the user running VS Code has permission to install packages with `pip`.
- **Driver errors when connecting** — install the matching system driver (e.g. ODBC driver for SQL Server) before pointing the extension at that database.
- **Authentication errors** — double-check the API key, model name spelling, and (for Azure) the deployment name and endpoint.
- **No response / silent failures** — open the **openQL Agent** output channel from `View → Output` to see the Python stderr stream.

---

## 🔒 Privacy

- Your API key and connection string are stored in VS Code's global settings on your machine.
- Natural-language questions and the resulting SQL are sent to the LLM provider you configured.
- Query results are read by the Python backend running locally on your machine and rendered in the panel — they are not sent anywhere by this extension.

---

## 📋 Requirements

- VS Code `^1.80.0`
- Python `>=3.9` on `PATH`
- A valid API key for one of: OpenAI, Azure OpenAI, Anthropic, or Google Gemini
- A reachable SQL database

---

## 📝 Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for the full release history.

---

## 📄 License

This extension is released under the MIT License — see [LICENSE.md](./LICENSE.md).
