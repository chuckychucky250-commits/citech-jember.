import re

with open('C:/Users/acer/Downloads/CITECH/frontend/src/main.js', 'r', encoding='utf-8') as f:
    data = f.read()

# Replace evt_001
data = data.replace("category: 'bencana', color: '#DC2626', year: '1998'", "category: 'tragedi', color: '#DC2626', year: '1998'")

# Replace other 'bencana'
data = data.replace("category: 'bencana', color: '#DC2626'", "category: 'bencana', color: '#9333EA'")

with open('C:/Users/acer/Downloads/CITECH/frontend/src/main.js', 'w', encoding='utf-8') as f:
    f.write(data)
print("Done")
