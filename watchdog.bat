@echo off
:loop
node C:\Users\globa\Toy-Party\nuclearSync.js >> C:\Users\globa\Toy-Party\logs\push.log 2>> C:\Users\globa\Toy-Party\logs\error-log.md
if %ERRORLEVEL% neq 0 (
    echo Restarting at %date% %time% >> C:\Users\globa\Toy-Party\logs\watchdog.log
    timeout /t 60
)
timeout /t 300
goto loop
