@echo off
echo ========================================
echo   LMS Pro - First Time Setup
echo ========================================
echo.
echo [1/3] Installing Angular CLI...
npm install -g @angular/cli

echo [2/3] Installing Frontend Dependencies...
cd frontend\lms-frontend
npm install
cd ..\..

echo [3/3] Setting up Database...
cd backend\LMS.API
dotnet restore
dotnet ef migrations add InitialCreate --output-dir Migrations
dotnet ef database update
cd ..\..

echo.
echo ✅ Setup complete!
echo.
echo Run start-backend.bat then start-frontend.bat
echo.
pause
