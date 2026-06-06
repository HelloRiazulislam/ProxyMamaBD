import os
import re

def patch_file(file_path):
    print(f"Patching file: {file_path}")
    with open(file_path, 'r') as f:
        content = f.read()
    
    lines = content.splitlines()
    for i, line in enumerate(lines):
        # Match compileSdkVersion / compileSdk
        if re.search(r'\bcompileSdkVersion\b', line):
            lines[i] = re.sub(r'\bcompileSdkVersion\s+.*', 'compileSdkVersion 34', line)
        elif re.search(r'\bcompileSdk\b', line):
            if '=' in line:
                lines[i] = re.sub(r'\bcompileSdk\s*=.*', 'compileSdk = 34', line)
            else:
                lines[i] = re.sub(r'\bcompileSdk\s+.*', 'compileSdk 34', line)
                
        # Match targetSdkVersion / targetSdk
        elif re.search(r'\btargetSdkVersion\b', line):
            lines[i] = re.sub(r'\btargetSdkVersion\s+.*', 'targetSdkVersion 34', line)
        elif re.search(r'\btargetSdk\b', line):
            if '=' in line:
                lines[i] = re.sub(r'\btargetSdk\s*=.*', 'targetSdk = 34', line)
            else:
                lines[i] = re.sub(r'\btargetSdk\s+.*', 'targetSdk 34', line)
                
        # Match minSdkVersion / minSdk
        elif re.search(r'\bminSdkVersion\b', line):
            lines[i] = re.sub(r'\bminSdkVersion\s+.*', 'minSdkVersion 21', line)
        elif re.search(r'\bminSdk\b', line):
            if '=' in line:
                lines[i] = re.sub(r'\bminSdk\s*=.*', 'minSdk = 21', line)
            else:
                lines[i] = re.sub(r'\bminSdk\s+.*', 'minSdk 21', line)
                
    with open(file_path, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Successfully patched {file_path}")

print("WALKING DIRECTORIES TO FIND build.gradle...")
found_any = False
for root, dirs, files in os.walk('.'):
    for f in files:
        if f == 'build.gradle' and 'app' in root:
            p = os.path.join(root, f)
            try:
                patch_file(p)
                found_any = True
            except Exception as e:
                print(f"Error patching {p}: {e}")

if not found_any:
    print("No app-level build.gradle found! Listing directory structure:")
    for root, dirs, files in os.walk('.'):
        for f in files:
            print(os.path.join(root, f))
