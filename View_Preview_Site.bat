@echo off
rem Double-click to view the draft (preview) website at http://localhost:8081
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install it from https://nodejs.org and try again. & pause & exit /b 1)
if not exist "preview\index.html" (
  echo Building the preview site...
  node src\build.mjs --preview || (pause & exit /b 1)
)
start "" http://localhost:8081
echo.
echo  Preview site running at http://localhost:8081
echo  Close this window to stop it.
echo.
node tools\serve.mjs preview 8081
