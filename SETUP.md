# Local setup (Windows)

1. Install Node.js 20 or newer. No Python or Visual Studio C++ build tools are required.
2. Open PowerShell in this folder.
3. Run `npm.cmd install`.
4. Run `npm.cmd test` to test the API.
5. Run `npm.cmd start`.
6. Open `http://127.0.0.1:3001` in your browser.

The SQLite database is stored locally in `taskflow.sqlite`. The server saves database changes to this file, so tasks persist after restarting. Do not upload the database file publicly.
