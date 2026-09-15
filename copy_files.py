import os
import shutil

base_dir = r'C:\Users\hp\Desktop\mukh4mmadovoriginal'

files_to_copy = [
    r'src\data\newPassages.ts',
    r'src\data\readingTests.ts',
    r'src\data\readingTests_new.ts',
    r'src\data\studyWisdom.ts',
    r'src\data\cambridgePassages.ts'
]

for file in files_to_copy:
    ts_path = os.path.join(base_dir, file)
    js_path = ts_path.replace('.ts', '.js')

    try:
        shutil.copy2(ts_path, js_path)
        with open(ts_path, 'w') as f:
            f.write('')
        print(f'Copied {file} to {os.path.basename(js_path)}')
    except Exception as e:
        print(f'Error processing {file}: {e}')

print('Done!')
