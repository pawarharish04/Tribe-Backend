@echo off
echo Creating directories...
echo.

mkdir "c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\api\trending-creators" 2>nul
if errorlevel 1 (
    echo Directory 1 might already exist or failed
) else (
    echo Directory 1 created
)

mkdir "c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\(protected)\discover\trending" 2>nul
if errorlevel 1 (
    echo Directory 2 might already exist or failed
) else (
    echo Directory 2 created
)

echo.
echo Verification Results:
echo =====================

if exist "c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\api\trending-creators" (
    echo ✓ Directory 1 exists: c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\api\trending-creators
) else (
    echo ✗ Directory 1 does NOT exist
)

if exist "c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\(protected)\discover\trending" (
    echo ✓ Directory 2 exists: c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\(protected)\discover\trending
) else (
    echo ✗ Directory 2 does NOT exist
)

echo.
echo Listing directory structure:
echo ============================
dir "c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app" /s /b
