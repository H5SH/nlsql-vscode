# Changelog

All notable changes to the **openQL Agent** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-23

### Added
- Initial public release of openQL Agent.
- Chat-style webview panel for asking natural-language questions about your database.
- Settings tab for configuring model, API key, endpoint, Azure toggle, and SQL connection URL.
- Multi-provider LLM support: OpenAI, Anthropic Claude, Azure OpenAI, and Google Gemini (provider auto-detected from the model name).
- Database connection via SQLAlchemy connection URL — works with PostgreSQL, MySQL, Microsoft SQL Server, and SQLite.
- Shows the exact SQL query generated and executed alongside every answer.
- Bundled Python backend with automatic virtual-environment bootstrap and dependency install on first launch.
- `openQL: Open Chat` command to focus the panel from the Command Palette.
