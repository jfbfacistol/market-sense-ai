import pandas as pd
from sqlalchemy import create_engine

# 1. Connection Details (Matching your Docker command)
# user: postgres, password: market-sense, host: localhost, port: 5433, db: postgres
engine = create_engine('postgresql://postgres:market-sense@localhost:5433/postgres')

print("Reading CSV... (This might take a minute for 170MB)")
# Use chunking so we don't crash your RAM again
csv_file = 'realtor-data.csv' 

# 2. Upload in chunks of 10,000 rows
chunksize = 10000
for i, chunk in enumerate(pd.read_csv(csv_file, chunksize=chunksize)):
    # Rename columns to lowercase/snake_case to make SQL easier
    chunk.columns = [c.lower().replace(' ', '_') for c in chunk.columns]
    
    # Send to a table called 'properties'
    # 'if_exists' is 'append' so we don't overwrite every time
    chunk.to_sql('properties', engine, if_exists='append', index=False)
    print(f"Uploaded chunk {i+1} ({(i+1)*chunksize} rows)...")

print("Successfully migrated 170MB CSV to PostgreSQL!")