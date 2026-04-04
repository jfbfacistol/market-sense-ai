import kagglehub
import shutil
import os

print("Downloading dataset from Kaggle...")
# This downloads the dataset to a hidden cache folder
cache_path = kagglehub.dataset_download("ahmedshahriarsakib/usa-real-estate-dataset")
print(f"Downloaded to cache: {cache_path}")

print("Moving CSV to your project folder...")
# This finds the CSV in that cache folder and copies it right next to this script
for file in os.listdir(cache_path):
    if file.endswith(".csv"):
        source_file = os.path.join(cache_path, file)
        destination_file = "./realtor-data.csv"
        shutil.copy(source_file, destination_file)
        print(f"Success! Copied {file} to your data_prep folder.")