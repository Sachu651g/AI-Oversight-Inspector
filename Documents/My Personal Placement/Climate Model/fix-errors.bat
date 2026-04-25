@echo off
REM Climate Guardian - Error Fix Script (Windows)
REM This script fixes common installation and setup errors

echo.
echo ========================================
echo Climate Guardian - Error Fix Script
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. Please install npm 9+ first.
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo [OK] npm found
npm --version
echo.

REM Fix Backend
echo ========================================
echo Fixing Backend...
echo ========================================
echo.

cd backend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] backend folder not found
    pause
    exit /b 1
)

echo   - Removing old node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo   - Installing dependencies...
call npm install

echo   - Building TypeScript...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend fixed successfully
) else (
    echo [ERROR] Backend build failed. Check errors above.
)

cd ..
echo.

REM Fix Frontend
echo ========================================
echo Fixing Frontend...
echo ========================================
echo.

cd frontend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] frontend folder not found
    pause
    exit /b 1
)

echo   - Removing old node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo   - Installing dependencies...
call npm install --legacy-peer-deps

echo   - Type checking...
call npm run type-check

if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend fixed successfully
) else (
    echo [WARNING] Frontend has type errors (this is normal if dependencies just installed)
)

cd ..
echo.

REM Summary
echo ========================================
echo Error fix script completed!
echo ========================================
echo.
echo Next steps:
echo 1. Configure backend\.env file
echo 2. Setup database: psql -U postgres -d climate_guardian -f database\schema.sql
echo 3. Start Redis: redis-server
echo 4. Start backend: cd backend ^&^& npm run dev
echo 5. Start frontend: cd frontend ^&^& npm run dev
echo.
echo See INSTALLATION_STEPS.md for detailed instructions.
echo.
pause
