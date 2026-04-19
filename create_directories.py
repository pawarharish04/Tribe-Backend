import os

dir1 = r'c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\api\trending-creators'
dir2 = r'c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app\(protected)\discover\trending'

print('Creating directories...')
print('=' * 60)

# Create directory 1
try:
    os.makedirs(dir1, exist_ok=True)
    print('✓ Directory 1 created successfully')
    print(f'  {dir1}')
except Exception as e:
    print(f'✗ Directory 1 FAILED: {e}')

# Create directory 2
try:
    os.makedirs(dir2, exist_ok=True)
    print('✓ Directory 2 created successfully')
    print(f'  {dir2}')
except Exception as e:
    print(f'✗ Directory 2 FAILED: {e}')

print('\nVerification Results:')
print('=' * 60)

# Verify directory 1
if os.path.exists(dir1) and os.path.isdir(dir1):
    print('✓ Directory 1 exists and is accessible')
else:
    print('✗ Directory 1 does NOT exist')

# Verify directory 2
if os.path.exists(dir2) and os.path.isdir(dir2):
    print('✓ Directory 2 exists and is accessible')
else:
    print('✗ Directory 2 does NOT exist')

print('\nDirectory Listing:')
print('=' * 60)
app_dir = r'c:\Users\Lenovo\Desktop\PROJECTS\TribeV1\tribe-backend\src\app'
try:
    for root, dirs, files in os.walk(app_dir):
        level = root.replace(app_dir, '').count(os.sep)
        indent = ' ' * 2 * level
        print(f'{indent}{os.path.basename(root)}/')
        subindent = ' ' * 2 * (level + 1)
        for d in dirs:
            print(f'{subindent}{d}/')
except Exception as e:
    print(f'Error listing directories: {e}')
