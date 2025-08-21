@echo off
echo Clearing Spotify Native Toggler credentials and tokens...
if exist "%USERPROFILE%\.spotify-native-toggler" (
    rmdir /s /q "%USERPROFILE%\.spotify-native-toggler"
    echo Credentials cleared successfully!
) else (
    echo No credentials found to clear.
)
echo.
echo You can now run the app to set up fresh credentials.
pause
