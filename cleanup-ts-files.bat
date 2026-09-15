@echo off
cd /d "C:\Users\hp\Desktop\mukh4mmadovoriginal"

echo Deleting all .ts and .tsx files...

del /F /Q "next-env.d.ts"
del /F /Q "next.config.ts"
del /F /Q "tailwind.config.ts"

del /F /Q "src\app\api\ai-chat\route.ts"
del /F /Q "src\app\auth\callback\route.ts"

del /F /Q "src\data\*.ts"

del /F /Q "src\hooks\*.ts"

del /F /Q "src\lib\*.ts"
del /F /Q "src\lib\ai\*.ts"
del /F /Q "src\lib\ai\providers\*.ts"
del /F /Q "src\lib\analytics\*.ts"
del /F /Q "src\lib\supabase\*.ts"
del /F /Q "src\lib\supabase\repositories\*.ts"
del /F /Q "src\lib\supabase\services\*.ts"

del /F /Q "src\types\*.ts"

del /F /Q "src\app\admin\*.tsx"
del /F /Q "src\app\*.tsx"
del /F /Q "src\components\admin\*.tsx"
del /F /Q "src\components\ai\*.tsx"
del /F /Q "src\components\auth\*.tsx"
del /F /Q "src\components\reading\*.tsx"
del /F /Q "src\components\shared\*.tsx"
del /F /Q "src\contexts\*.tsx"

echo Deleted all .ts and .tsx files
echo Deleting .next folder...
rmdir /S /Q ".next"
echo Deleted .next folder
echo Deleting tsconfig.json if exists...
if exist "tsconfig.json" del /F /Q "tsconfig.json"
echo Cleanup complete!
pause
