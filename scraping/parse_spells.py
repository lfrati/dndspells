import json
from pathlib import Path
import re

from bs4 import BeautifulSoup
from tqdm import tqdm

from shutil import copy2


def parse_components(input_string):

    # Use regex to find content within parentheses
    match = re.search(r"\((.*?)\)", input_string)

    # Extract the content if a match is found
    materials = match.group(1) if match else ""

    # Use regex to remove everything within parentheses
    components = re.sub(r"\s*\(.*?\)", "", input_string)

    return components, materials


def parse_info(info):
    lines = info.getText().split("\n")
    lines = [line.split(":") for line in lines]
    return {key.lower().replace(" ", "_"): val.strip() for key, val in lines}


def parse_spell(soup):

    spell = {}
    spell["icon"] = ""
    spell["upcast"] = ""

    # remove garbage
    for node in soup.find_all("div", {"class": "content-separator"}):
        node.decompose()

    """
    Spell list.

    e.g. <p><strong><em>Spell Lists.</em></strong> <a href="http://dnd5e.wikidot.com/spells:druid">Druid</a>, <a href="http://dnd5e.wikidot.com/spells:sorcerer">Sorcerer</a>, <a href="http://dnd5e.wikidot.com/spells:wizard">Wizard</a></p>

    At Higher Levels.

    <p><strong><em>At Higher Levels.</em></strong> The spell creates more than one beam when you reach higher levels: two beams at 5th level, three beams at 11th level, and four beams at 17th level. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam.</p>
    """

    nodes = soup.select("p:has(strong):has(em)")

    for node in nodes:
        text = node.getText()
        if text.startswith("Spell Lists. "):
            spell["lists"] = text.replace("Spell Lists. ", "")
            node.decompose()
        elif text.startswith("At Higher Levels. "):
            spell["upcast"] = text.replace("At Higher Levels. ", "")
            node.decompose()

    ps = soup.find_all("p")
    """
    The first 3 fields are fixed (I hope):

    1) <p>Source: Xanathar's Guide to Everything</p>
    2) <p><em>1st-level evocation (ritual)</em></p>
    3) <p><strong>Casting Time:</strong> 1 hour<br/>
          <strong>Range:</strong> Touch<br/>
          <strong>Components:</strong> V, S, M (25 gp worth of powdered silver, which the spell consumes)<br/>
          <strong>Duration:</strong> Instantaneous (see below)</p>
    """
    source, school, info = ps[:3]

    spell["source"] = source.getText().replace("Source: ", "")
    source.decompose()
    spell["school"] = school.getText()
    school.decompose()

    spell.update(parse_info(info))
    components, materials = parse_components(spell["components"])
    spell["components"] = components
    spell["materials"] = materials
    info.decompose()

    """
    Description can have:
    bullet list: 
        http://dnd5e.wikidot.com/spell:gust
    multiple <p>:
        http://dnd5e.wikidot.com/spell:ceremony
    table:
        http://dnd5e.wikidot.com/spell:chaos-bolt

    I'm not going to deal with a table. It would mess up cards too much.
    """
    # remaining = soup.find_all(["p", "ul"])
    # spell["description"] = "\n".join([str(tag) for tag in remaining])
    description = soup.find("div", {"id": "page-content"})
    description = [str(child) for child in description.children if child != "\n"]
    spell["description"] = "\n".join(description)

    return spell


def parse_antagonize(soup):

    spell = {}
    spell["upcast"] = ""
    spell["icon"] = ""
    spell["materials"] = ""

    # remove garbage
    for node in soup.find_all("div", {"class": "content-separator"}):
        node.decompose()
    nodes = soup.select("p:has(strong)")

    for node in nodes:
        text = node.getText()
        if text.startswith("Spell Lists. "):
            spell["lists"] = text.replace("Spell Lists. ", "")
            node.decompose()
        elif text.startswith("At Higher Levels. "):
            spell["upcast"] = text.replace("At Higher Levels. ", "")
            node.decompose()

    ps = soup.find_all("p")
    source, school, _cast_time, _range, _components, _duration = ps[:6]
    spell["source"] = source.getText().replace("Source: ", "")
    source.decompose()
    spell["school"] = school.getText()
    school.decompose()

    # spell.update(parse_info(info))

    def _parse_info(info):
        line = info.getText()
        return line.split(":")[1].strip()

    spell["casting_time"] = _parse_info(_cast_time)
    spell["range"] = _parse_info(_range)
    spell["duration"] = _parse_info(_duration)
    # components, materials = parse_components(_components)
    # spell["components"] = components
    # spell["materials"] = materials
    _cast_time.decompose()
    _range.decompose()
    _duration.decompose()
    _components.decompose()

    remaining = soup.find_all(["p", "ul"])
    spell["description"] = "\n".join([str(tag) for tag in remaining])

    return spell


# special fucked up spell format

# html = raw_spells["Antagonize"]
# soup = BeautifulSoup(html, "html.parser")
#
# spell = parse_antagonize(soup)
# for key, val in spell.items():
#     print(f"{key}:[{val}]")


#%%

with open("../data/raw_spells.json", "r") as f:
    raw_spells = json.load(f)

folder = Path("../icons")
dest = Path("../data/spell_icons")
icons = set([icon.as_posix() for icon in Path(folder).iterdir()])

parsed_spells = {}
for name, html in tqdm(raw_spells.items()):
    if "(HB)" in name:
        continue
    soup = BeautifulSoup(html, "html.parser")
    if name == "Antagonize":
        spell = parse_antagonize(soup)
    else:
        spell = parse_spell(soup)

    spell["name"] = name
    icon_name = name.replace("'", "%27").replace(" ", "_") + ".png"
    src = folder / icon_name
    found = src.as_posix() in icons
    # if found:
    #     spell["icon"] = icon_name
    #     copy2(src, dest / icon_name)
    #     # print(f"Moving {icon_name} from {src} to {dest / icon_name}")
    if "cantrip" in spell["school"]:
        spell["level"] = 0
    else:
        spell["level"] = int(spell["school"][0])

    parsed_spells[name] = spell

with open("../data/clean_spells.json", "w") as f:
    f.write(json.dumps(parsed_spells, sort_keys=True, indent=2))

# [name for name in parsed_spells if "(HB)" in name]

# parsed_spells["Telekinesis"]

# #%%
#
#
# folder = "../icons"
# icons = set([icon.as_posix() for icon in Path(folder).iterdir()])
#
#
# # ANSI escape codes for colors
# red = "\033[91m"
# green = "\033[92m"
# reset = "\033[0m"
#
#
# def success(message, condition):
#     return f"{green if condition else red}{message}{reset}"
#
#
# for name, spell in parsed_spells.items():
#     name = spell["name"]
#     icon_name = name.replace("'", "%27").replace(" ", "_")
#     icon_name = f"{folder}/{icon_name}.png"
#     found = icon_name in icons
#     print(success(icon_name, found))
