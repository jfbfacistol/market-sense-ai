import pandas as pd

print("Loading the massive dataset...")
df = pd.read_csv('realtor-data.csv')

# Drop any rows that are completely missing critical data to keep it clean
df = df.dropna(subset=['price', 'city', 'state', 'zip_code'])

# Take a random, clean sample of 10,000 rows for our prototype
print("Shrinking data for the AI prototype...")
df_small = df.sample(n=10000, random_state=42)

# Save it as our final working file
df_small.to_csv('realtor_data_cleaned.csv', index=False)

print("Success! Created 'realtor_data_cleaned.csv' with 10,000 clean rows.")