
phonetic_names = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "Xray", "Yankee", "Zulu"];

id_counter = 0;

function generate_next_id() {
    let phonetic_name = phonetic_names[id_counter % phonetic_names.length];
    let new_id = phonetic_name + "-" + int(id_counter / phonetic_names.length);
    id_counter++;
    return new_id;
}

function display_id(id, x, y) {
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text(id, x, y);
}