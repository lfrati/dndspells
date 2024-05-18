const STORAGE_NAME = "qb41tc90zEkiDiOh6UcjD0ChhuSmRyfh";
const spells_list = {};
for (let spell of spells) {
  spells_list[spell.name] = spell;
}

function get_cards() {
  let state = [];
  for (let node of document.querySelectorAll(
    "#cards-container .card #spellname"
  )) {
    state.push(node.innerHTML);
  }
  return state;
}

function remove_card(card) {
  card.classList.add("removing");
  setTimeout(() => {
    card.remove();
  }, 300);
}

function remove_all() {
  let div = document.getElementById("cards-container");
  div.innerHTML = "";
}

function serialize() {
  const state = get_cards();
  console.log(state);
  // Serialize the dictionary
  const serializedState = JSON.stringify(state);

  // Store in localStorage
  localStorage.setItem(STORAGE_NAME, serializedState);
  console.log("Data stored");

  remove_all();
  restore();
}

function compare(a, b) {
  if (a.level === b.level) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
  return a.level < b.level ? -1 : 1;
}

function restore() {
  // Retrieve the stored string
  const serializedState = localStorage.getItem(STORAGE_NAME);

  // Deserialize the string back to an object
  if (serializedState) {
    const state = JSON.parse(serializedState);
    let spells = state.map((name) => spells_list[name]);
    spells = spells.sort(compare);
    console.log(spells);
    console.log("Data retrieved:", state);
    for (let spell of spells) {
      make_spell(spell);
    }
  }
}

function make_spell(spell) {
  const container = document.getElementById("cards-container");

  const card = document.createElement("div");
  card.className = "card";
  card.onclick = function () {
    remove_card(this);
  };

  card.innerHTML = make_card(spell);

  container.appendChild(card);
}

// document
//   .querySelector("#searchInput")
//   .addEventListener("keydown", function (event) {
//     if (event.key === "Escape" || event.key === "Esc") {
//       this.blur();
//     }
//   });

// document.querySelector("#searchInput").addEventListener("blur", function () {
//   const suggestions = document.getElementById("suggestions");
//   suggestions.innerHTML = ""; // Clear previous suggestions
//   this.value = "";
// });

document.addEventListener("click", function (event) {
  const suggestions = document.getElementById("suggestions");
  const searchInput = document.getElementById("searchInput");
  if (!suggestions.contains(event.target) && event.target !== searchInput) {
    clear_suggestions();
  }
});

function clear_suggestions() {
  const suggestions = document.getElementById("suggestions");
  const searchInput = document.getElementById("searchInput");
  suggestions.innerHTML = ""; // Clear suggestions if clicked outside
  searchInput.value = ""; // also clear input field
  suggestions.classList.add("hidden");
}

document.querySelector("#searchInput").addEventListener("input", function () {
  const input = this.value;
  const suggestions = document.getElementById("suggestions");
  suggestions.innerHTML = ""; // Clear previous suggestions

  const cards = get_cards();

  if (input.length > 0) {
    suggestions.classList.remove("hidden");
    const filteredKeys = Object.keys(spells_list).filter(
      (key) =>
        key.toLowerCase().includes(input.toLowerCase()) && !cards.includes(key)
    );

    filteredKeys.forEach((key) => {
      const li = document.createElement("li");
      let spell = spells_list[key];
      li.textContent = `${key}`;
      li.onclick = function () {
        make_spell(spell);
        clear_suggestions();
        serialize();
      };
      suggestions.appendChild(li);
    });
  }
});

function make_card(spell) {
  return `<h1 id="spellname">${spell.name}</h1>
      <h2 id="spellschool">${spell.school}</h2>
      <div class="details">
        <div class="detail">
          <strong>CASTING TIME</strong>
          <span>${spell.casting_time}</span>
        </div>
        <div class="detail">
          <strong>RANGE</strong>
          <span>${spell.range}</span>
        </div>
        <div class="detail">
          <strong>COMPONENTS</strong>
          <span>${spell.components}</span>
        </div>
        <div class="detail">
          <strong>DURATION</strong>
          <span>${spell.duration}</span>
        </div>
      </div>
      <div class="description">
        ${
          spell.materials
            ? "<p><strong>Materials:</strong> " + spell.materials + "</p>"
            : ""
        }
        <p>
        ${spell.description}
        </p>
        ${
          spell.upcast
            ? "<p><strong>At Higher Levels:</strong> " + spell.upcast + "</p>"
            : ""
        }`;
}

restore();
