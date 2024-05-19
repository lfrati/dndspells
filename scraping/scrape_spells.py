import json

from bs4 import BeautifulSoup
import requests
from tqdm import tqdm, trange

#%%


# get_spell_url(fields[0])
def get_spell_url(field):
    loc = field.find("a").get("href")
    assert len(loc) > 0
    spell_url = f"{base}{loc}"
    return spell_url


#%%


base = "http://dnd5e.wikidot.com"
# URL of the page
url = f"{base}/spells"

# Send a GET request to the URL
response = requests.get(url)

# Check if the request was successful
assert response.status_code == 200

# Parse the HTML content
soup = BeautifulSoup(response.text, "html.parser")

raw_data = {}

for level in trange(10, position=0):
    # Find the div with the specified ID
    div_content = soup.find("div", id=f"wiki-tab-0-{level}")

    # Check if the div was found
    assert div_content, f"Level {level} not found. Skipping"

    # Find all tr elements within this div
    tr_elements = div_content.find_all("tr")

    # keys = ['Spell Name', 'School', 'Casting Time', 'Range', 'Duration', 'Components']
    keys = [key.getText() for key in tr_elements[0].find_all("th")]
    assert len(keys) == 6

    for row in tqdm(tr_elements[1:], position=1, leave=False):
        fields = row.find_all("td")
        entry = {key: value.getText() for key, value in zip(keys, fields)}
        name = entry["Spell Name"]
        if "(UA)" not in name:
            spell_url = get_spell_url(fields[0])
            spell_response = requests.get(spell_url)
            assert spell_response.status_code == 200
            spell_soup = BeautifulSoup(spell_response.text, "html.parser")
            content_soup = spell_soup.find("div", {"id": "page-content"})
            raw_data[name] = str(content_soup)
            # time.sleep(0.1)
        # print(f"Added: {entry['Spell Name']} ({level}).")

raw_file = "../data/raw_spells.json"
print(f"Scraped {len(raw_data)} spells. Saving to {raw_file}")

serialized = json.dumps(raw_data)
with open(raw_file, "w") as f:
    f.write(serialized)

print("Done.")
