@echo off
cd /d "C:\Users\hp\Desktop\mukh4mmadovoriginal"

echo Converting large data files...

copy /Y "src\data\cambridgePassages.ts" "src\data\cambridgePassages.js"
type nul > "src\data\cambridgePassages.ts"

copy /Y "src\data\newPassages.ts" "src\data\newPassages.js"
type nul > "src\data\newPassages.ts"

copy /Y "src\data\readingTests.ts" "src\data\readingTests.js"
type nul > "src\data\readingTests.ts"

copy /Y "src\data\readingTests_new.ts" "src\data\readingTests_new.js"
type nul > "src\data\readingTests_new.ts"

copy /Y "src\data\studyWisdom.ts" "src\data\studyWisdom.js"
type nul > "src\data\studyWisdom.ts"

echo Conversion complete!
pause
