@echo off
setlocal
set "ROOT=%~dp0"
"%ROOT%.venv-sadtalker\Scripts\python.exe" "%ROOT%scripts\talk_photo.py" %*
