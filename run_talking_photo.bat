@echo off
setlocal
set "ROOT=%~dp0"
"%ROOT%backend\.venv-sadtalker\Scripts\python.exe" "%ROOT%backend\scripts\talk_photo.py" %*
