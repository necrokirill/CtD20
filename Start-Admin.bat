@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запуск Студии Издателя и локального сервера CtD 20...
python tools\admin.py --port 8080
pause
