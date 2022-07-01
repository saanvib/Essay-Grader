const express = require('express')
const app = express()
const port = 3000
const prepositions = ["about", "above", "across", "after", "ago", "at", "before", "below", "beside", "by", "down", "during", "for", "from", "in", "into", "off", "on", "over", "past", "since", "through", "to", "under", "until", "up", "with"];
var grade = 100;
var full_essay;
var essay_arr;
var unique_words = new Map();
const all_words = new Set();

const fs = require('fs');
const readline = require('readline');

async function loadwords() {
    var count = 0;
  const fileStream = fs.createReadStream('words_alpha.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    all_words.add(line.trim());
        count++;
  }
  console.log("loaded " + count.toString() + " words");
}

loadwords();

// const full_essay = "What is computational 'off. gots! It is to get gotten for ? ab out! has been  getting above;";
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/', (req, res) => {
    console.log(req.body.user_name); 
    console.log(req.body.user_message); 
    full_essay = req.body.user_message;
    essay_arr = full_essay.split(" ");
    for (i = 0; i < essay_arr.length; i++) {
        if (unique_words.has(essay_arr[i])) {
            unique_words.set(essay_arr[i], unique_words.get(essay_arr[i])+1);
        }
        else {
            unique_words.set(essay_arr[i], 1);
        }
    }

    grade_essay(full_essay);
    console.log(grade);
  res.send(grade.toString());

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
function isalpha(c) {
    return (((c >= 'a') && (c <= 'z')) || ((c >= 'A') && (c <= 'Z')));
    }

function grade_essay(essay) {
    grade -= prep_rule(essay);
    grade -= length_rule(essay);
    grade -= nasty_no_nos_rule(essay);
    grade -= spelling_rule(essay);
}
// ASSUMING FOR EVERY OCCURRENCE I TAKE OFF 5% off for any sentence that, lord forbid, ends in a preposition (like "for," "of," etc.)
// assuming there can be spaces before punctuation
// sentences will only end in a "." or "!" or "?"
// finds every end of sentence and works backwards to find the last word
// list of prepositions taken from _________
function prep_rule(essay) {
    var point_loss = 0;
    for (i = 0; i < essay.length; i++) {
        if (essay.charAt(i) === "." || essay.charAt(i) === "?" || essay.charAt(i) === "!") {
            // look for first letter to the left of the punctuation
            var j = i-1;
            while (j >=0 && !isalpha(essay.charAt(j))) {
                j--;
            }
            var k = j;
            while (isalpha(essay.charAt(k))) {
                k--;
            }
            var word = essay.substring(k+1, j+1);
            console.log(word);
            for (l = 0; l < prepositions.length; l++) {
                if (word === prepositions[l]) {
                    point_loss += 5;
                    console.log("prep " + word);
                }
            }
        }
    }
    console.log(point_loss);
    return point_loss;
}

function length_rule(essay) {
    // TODO: split whitespace of all types
    var point_loss = 0;
    if (essay_arr.length < 500 || essay_arr.length > 1000) {
        point_loss = 50;
    }
    console.log(point_loss);
    return point_loss;
}

// finds every nasty no no in the essay
function nasty_no_nos_rule(essay) {
    var point_loss = 0;
    for (i = 0; i < essay_arr.length; i++) {
        if (essay_arr[i] === "very" || essay_arr[i] === "really" || essay_arr[i] == "get" || essay_arr[i] == "gets" || essay_arr[i] == "got" || essay_arr[i] == "getting" || essay_arr[i] == "gotten")  {
            console.log(essay_arr[i]);
            point_loss += 1;
        }
    }
    return point_loss;
}

// for every word in unique words we check spelling 
function spelling_rule(essay) {
    var point_loss = 0;
    for (let [key, value] of unique_words) {
        if (all_words.has(key)) {
            point_loss += value;
        }
    }
    return point_loss;
    
}
