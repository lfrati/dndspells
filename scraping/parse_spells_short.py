import json
from pathlib import Path
import re
from collections import defaultdict

spells = json.loads(Path("./spells.json").read_text())


parse_components = lambda x: re.sub(" \\(.*\\)", "", x)
# print(spells["Web"])
# components = spells["Web"]["components"]
# print(components)
# print(parse_components(components))
parse_speed = lambda x: {
    "1 action": "action",
    "1 bonus action": "bonus",
    "1 hour": "other",
    "1 minute": "other",
    "1 reaction, which you take when you are hit by an attack or targeted by the magic missile spell": "reaction",
    "1 reaction, which you take when you see a creature within 60 feet of you casting a spell": "reaction",
    "10 minutes": "other",
}[x]
is_concentration = lambda x: "Concentration" in x

# set(
#     [
#         spell["duration"]
#         for name, spell in spells.items()
#         if "Concentration" in spell["duration"]
#     ]
# )

duration_opts = defaultdict(lambda: -1)
# duration_opts["Concentration, up to 1 day"] = -1
# duration_opts["Concentration, up to 1 hour"] = -1
# duration_opts["Concentration, up to 8 hours"] = -1
duration_opts["Concentration, up to 1 minute"] = 10
duration_opts["Concentration, up to 10 minutes"] = 100
parse_duration = lambda x: duration_opts[x]

#%%

spells_info = []
for name, spell in spells.items():
    body = json.dumps(
        {
            "speed": parse_speed(spell["casting_time"]),
            "duration": parse_duration(spell["duration"]),
            "concentration": is_concentration(spell["duration"]),
            "level": spell["level"],
        }
    )
    spells_info.append(f'"{name}" : {body}')

to_store = "let spells_list = {" + ",\n".join(spells_info) + "}"
print(to_store)

with open("parsed_spells.js", "w") as f:
    f.write(to_store)
