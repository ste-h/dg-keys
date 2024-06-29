import os

def capitalize_after_underscore(file_name):
    parts = file_name.split('_')
    capitalized_parts = [parts[0]] + [part.capitalize() for part in parts[1:]]
    return '_'.join(capitalized_parts)

def rename_png_files(folder_path):
    for file_name in os.listdir(folder_path):
        if file_name.endswith('.png'):
            new_name = capitalize_after_underscore(file_name)
            old_file_path = os.path.join(folder_path, file_name)
            new_file_path = os.path.join(folder_path, new_name)
            os.rename(old_file_path, new_file_path)
            print(f'Renamed: {file_name} -> {new_name}')

# Specify the folder path
folder_path = './key_images'
rename_png_files(folder_path)
