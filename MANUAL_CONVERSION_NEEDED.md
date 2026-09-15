# Manual Conversion Steps Needed

The following 5 data files are too large for the automated conversion tools to handle. Please run these PowerShell commands to complete their conversion:

```powershell
# Navigate to project directory
cd "C:\Users\hp\Desktop\mukh4mmadovoriginal"

# 1. Copy and empty cambridgePassages.ts
Copy-Item "src\data\cambridgePassages.ts" "src\data\cambridgePassages.js"
Set-Content "src\data\cambridgePassages.ts" -Value ""

# 2. Copy and empty newPassages.ts
Copy-Item "src\data\newPassages.ts" "src\data\newPassages.js"
Set-Content "src\data\newPassages.ts" -Value ""

# 3. Copy and empty readingTests.ts
Copy-Item "src\data\readingTests.ts" "src\data\readingTests.js"
Set-Content "src\data\readingTests.ts" -Value ""

# 4. Copy and empty readingTests_new.ts
Copy-Item "src\data\readingTests_new.ts" "src\data\readingTests_new.js"
Set-Content "src\data\readingTests_new.ts" -Value ""

# 5. Copy and empty studyWisdom.ts
Copy-Item "src\data\studyWisdom.ts" "src\data\studyWisdom.js"
Set-Content "src\data\studyWisdom.ts" -Value ""
```

After running these commands, the conversion will be complete and you can proceed with building the project.
