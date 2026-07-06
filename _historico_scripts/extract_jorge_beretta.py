import json
import sys

def main():
    file_path = r"C:\Users\admin\.gemini\antigravity\scratch\gerentesmec\chatwoot_june_dump_bruteforce.json"
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    jorge_beretta = data.get("JORGE BERETTA", [])
    print(f"Found {len(jorge_beretta)} conversations for JORGE BERETTA.")
    
    for conv in jorge_beretta:
        print(f"--- ID: {conv['id']} ---")
        print(conv.get("transcript", "No transcript"))
        print("-" * 40)

if __name__ == "__main__":
    main()
