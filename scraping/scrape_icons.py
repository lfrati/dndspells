import os
from pathlib import Path
import shutil

from bs4 import BeautifulSoup
import requests
from tqdm import tqdm

# Enter the full URL of the webpage you want to scrape
base_url = "https://bg3.wiki/"

# url = "https://bg3.wiki/wiki/Category:Action_Controller_Icons"
url = "https://bg3.wiki/w/index.php?title=Category:Action_Controller_Icons&filefrom=Multiattack+Air+Elemental+Icon.webp#mw-category-media"
# url = "https://bg3.wiki/wiki/Category:Generic_Controller_Icons"
# url = "https://bg3.wiki/wiki/Category:Passive_Feature_Controller_Icons"
# url = "https://bg3.wiki/w/index.php?title=Category:Passive_Feature_Controller_Icons&filefrom=Sentinel+Snare+Icon.webp#mw-category-media"
# url = "https://bg3.wiki/wiki/Category:Skill_Controller_Icons"
# url = "https://bg3.wiki/wiki/Category:Spell_Controller_Icons"
# url = "https://bg3.wiki/wiki/Category:Weapon_Action_Controller_Icons"
# url = "https://bg3.wiki/w/index.php?title=Category:Spell_Controller_Icons&filefrom=Globe+of+Invulnerability+Icon.webp#mw-category-media"

folder_path = "raw_icons"

response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")
images = soup.find_all("img")

if not os.path.exists(folder_path):
    os.makedirs(folder_path)

for img in tqdm(images):
    img_url = img.get("src")
    if not img_url.startswith("http"):
        img_url = (
            base_url + img_url
        )  # This appends the base URL if the img_url is relative
    img_response = requests.get(img_url, stream=True)
    with open(os.path.join(folder_path, img_url.split("/")[-1]), "wb") as file:
        for chunk in img_response.iter_content(chunk_size=1024):
            file.write(chunk)

#%%


clean_folder = "icons"

files = list(Path(folder_path).iterdir())
new_directory = Path(clean_folder)
new_directory.mkdir(exist_ok=True)

for file in tqdm(files):
    new_name = file.name.replace("144px-", "").replace("_Icon.webp", "")
    new_file = new_directory / new_name
    shutil.copy(file, new_file)

