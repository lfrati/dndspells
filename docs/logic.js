const STORAGE_NAME = "qb41tc90zEkiDiOh6UcjD0ChhuSmRyfh";
const SPELL_NAMES = get_spell_names();
let undo = () => {};

function get_spell_names() {
  let spells = Object.values(all_spells).sort(compare_spells);
  return spells.map((spell) => spell.name);
}

function get_card_names() {
  let state = Array.from(
    document.querySelectorAll("#cards-container .card")
  ).map((card) => card.dataset.title);
  return state;
}

/* There are 3 where we can undo:
- remove_card
- remove_all
- add_card
*/
function make_undo(callback) {
  // Get the button element
  const button = document.getElementById("undo-button");
  // Disable the button
  button.disabled = false;
  undo = () => {
    callback();
    sort_cards();
    serialize();
    undo = () => {};
    button.disabled = true;
  };
}

function remove_card(name, undoable) {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    if (card.dataset.title === name) {
      card.remove();
    }
  });
  // sort_cards(); // no need to sort on remove
  serialize();

  if (undoable) {
    make_undo(() => {
      console.log("Undoing remove", name);
      add_card(name, false);
    });
  }
}

function remove_all(undoable) {
  const names = get_card_names();
  if (names.length == 0) {
    return;
  }
  let div = document.getElementById("cards-container");
  div.innerHTML = "";
  // sort_cards(); // no need to sort on remove
  serialize();

  if (undoable) {
    make_undo(() => {
      console.log("Undoing remove_all", names);
      names.forEach((name) => {
        add_card(name, false);
      });
    });
  }
}

function add_card(name, undoable) {
  let spell = all_spells[name];
  const container = document.getElementById("cards-container");

  const card = document.createElement("div");
  card.className = "card";
  card.dataset.title = name;
  if (spell.casting_time.includes("bonus action")) {
    card.classList.add("bonusaction");
  } else if (spell.casting_time.includes("reaction")) {
    card.classList.add("reaction");
  } else {
    card.classList.add("action");
  }
  card.onclick = function (event) {
    event.preventDefault();
    remove_card(spell.name, true);
  };

  card.innerHTML = make_card(spell);
  container.appendChild(card);

  sort_cards();
  serialize();

  if (undoable) {
    make_undo(() => {
      console.log("Undoing add", spell.name);
      remove_card(name, false);
    });
  }
}

function compare_spells(a, b) {
  // order by level and then by name
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

function compare_cards(card1, card2) {
  return compare_spells(card2spell(card1), card2spell(card2));
}

function card2spell(card) {
  const h1 = card.querySelector("h1#spellname");
  let name = h1.textContent.trim();
  return all_spells[name];
}

function sort_cards() {
  let cards = Array.from(document.querySelectorAll(".card"));
  cards = cards.sort(compare_cards);
  let container = document.getElementById("cards-container");
  container.innerHTML = "";
  // Re-append the sorted div elements to the container
  cards.forEach((card) => container.appendChild(card));
}

function serialize() {
  const state = get_card_names();
  const serializedState = JSON.stringify(state);
  localStorage.setItem(STORAGE_NAME, serializedState);
  console.log("Data stored: ", serializedState);
}

function restore() {
  const serializedState = localStorage.getItem(STORAGE_NAME);

  if (serializedState) {
    const state = JSON.parse(serializedState);
    console.log("Data retrieved:", state);
    for (let name of state) {
      add_card(name);
    }
    sort_cards();
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
}

document.querySelector("#searchInput").addEventListener("input", function () {
  const input = this.value;
  const suggestions = document.getElementById("suggestions");
  suggestions.innerHTML = ""; // Clear previous suggestions

  const cards = get_card_names();

  if (input.length > 0) {
    const filteredKeys = SPELL_NAMES.filter(
      (key) =>
        key.toLowerCase().includes(input.toLowerCase()) && !cards.includes(key)
    );

    filteredKeys.forEach((key) => {
      const li = document.createElement("li");
      let spell = all_spells[key];
      li.innerHTML = `<strong>${key}</strong>${number_to_level(spell.level)}`;
      li.onclick = function () {
        add_card(spell.name, true);
        clear_suggestions();
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
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd";
    default:
      return String(num) + "th";
  }
}

restore();
