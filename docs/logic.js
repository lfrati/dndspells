const STORAGE_NAME = "qb41tc90zEkiDiOh6UcjD0ChhuSmRyfh";

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
    serialize();
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
    let spells = state.map((name) => all_spells[name]);
    spells = spells.sort(compare);
    console.log(spells);
    console.log("Data retrieved:", state);
    for (let spell of spells) {
      make_spell(spell);
    }
  }
}

function make_card(spell) {
  return `
    <div class="card-header">
      <h1 id="spellname">${spell.name}</h1>
      ${
        spell.duration.includes("Concentration")
          ? `<div class="card-c">C</div>`
          : ``
      }
    </div>
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
        ${spell.description}
        ${
          spell.upcast
            ? "<p><strong>At Higher Levels:</strong> " + spell.upcast + "</p>"
            : ""
        }`;
}

function make_spell(spell) {
  const container = document.getElementById("cards-container");

  const card = document.createElement("div");
  card.className = "card";
  if (spell.casting_time.includes("bonus action")) {
    card.classList.add("bonusaction");
  } else if (spell.casting_time.includes("reaction")) {
    card.classList.add("reaction");
  } else {
    card.classList.add("action");
  }
  card.oncontextmenu = function (event) {
    event.preventDefault();
    remove_card(this);
  };

  card.innerHTML = make_card(spell);

  container.appendChild(card);
}

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
    const filteredKeys = Object.keys(all_spells).filter(
      (key) =>
        key.toLowerCase().includes(input.toLowerCase()) && !cards.includes(key)
    );

    filteredKeys.forEach((key) => {
      const li = document.createElement("li");
      let spell = all_spells[key];
      li.innerHTML = `<strong>${key}</strong>&nbsp&nbsp&nbsp${number_to_level(
        spell.level
      )}`;
      li.onclick = function () {
        make_spell(spell);
        clear_suggestions();
        serialize();
      };
      suggestions.appendChild(li);
    });
  }
});

function number_to_level(num) {
  switch (num) {
    case 0:
      return "Cantrip";
    case 1:
      return "1st level";
    case 2:
      return "2nd level";
    case 3:
      return "3rd level";
    default:
      return String(num) + "th level";
  }
}

restore();
