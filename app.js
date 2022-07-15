const express = require('express')
const { MongoClient } = require('mongodb')
const db_url = 'mongodb://localhost:27017';
const client = new MongoClient(db_url);

const app = express()
const port = 2020
const prepositions = ["about", "above", "across", "after", "ago", "at", "before", "below", "beside", "by", "down", "during", "for", "from", "in", "into", "off", "on", "over", "past", "since", "through", "to", "under", "until", "up", "with"];
var grade = 100;
var full_essay;
var essay_arr;
var unique_words = new Map();
const all_words = new Set();
var reasons = [];

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
  // console.log(all_words);
}

loadwords();

// const full_essay = "What is computational 'off. gots! It is to get gotten for ? ab out! has been  getting above;";
const bodyParser = require('body-parser');
const { start } = require('repl');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))
app.post('/submit', async (req, res) => {
    full_essay = "";
    essay_arr = [];
    console.log(req.body.user_name); 
    student_name = req.body.user_name;
    console.log(req.body.user_message); 
    full_essay = req.body.user_message;
    essay_arr = full_essay.split(" ");
    for (i = 0; i < essay_arr.length; i++) {
        var word = essay_arr[i].toLowerCase().trim();
        if (unique_words.has(word)) {
            unique_words.set(word, unique_words.get(word)+1);
        }
        else {
            unique_words.set(word, 1);
        }
    }
    grade = 100;
    grade_essay(full_essay);
    console.log(grade);
    // save in database
    try {
        const database = client.db("grade_db");
        const grades = database.collection("grades");
        // create a document to insert
        const doc = {
          name: student_name,
          score: grade,
          grade_reason: reasons.toString(),
        }
        const result = await grades.insertOne(doc);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
       } 
       catch {
        console.log("insert failed");
       }
  res.send("Your grade is " + grade.toString() + "% because of " + reasons.toString());
  

})

app.get('/admin',  (req, res) => {
      res.sendFile(__dirname + "/admin.html");
})

app.get('/getgrades', async (req,res) => {
    var allgrades;
    try {
        const database = client.db("grade_db");
        const grades = database.collection("grades");
        const allGrades = await grades.find().toArray();
        
        // allgrades = res.json(allGrades);
        console.log(allGrades);
        var returnObj = {grades:[]};
        returnObj.grades = allGrades;
      } catch (error) {
        res.json({ message: error });
      }
    //   console.log(allgrades);
    res.json(returnObj);
      // res.send(allgrades);
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
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
    grade -= startingword_rule(essay);
    if (grade < -200) {
        grade == -200;
    }
    // put in grade
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
            // console.log(word);
            for (l = 0; l < prepositions.length; l++) {
                if (word === prepositions[l]) {
                    point_loss += 5;
                    // console.log("prep " + word);
                }
            }
        }
    }
    // console.log("prep loss " + point_loss);
    var reason = point_loss + " points taken off for prepositions at the end of a sentence";
    reasons.push(reason);
    return point_loss;
}

function length_rule(essay) {
    // TODO: split whitespace of all types
    var point_loss = 0;
    if (essay_arr.length < 500 || essay_arr.length > 1000) {
        point_loss = 50;
    }
    // console.log("length point loss" + point_loss);
    var reason = " " + point_loss + " points taken off for length";
    reasons.push(reason);
    return point_loss;
}

// finds every nasty no no in the essay
function nasty_no_nos_rule(essay) {
    var point_loss = 0;
    for (i = 0; i < essay_arr.length; i++) {
        if (essay_arr[i] === "very" || essay_arr[i] === "really" || essay_arr[i] == "get" || essay_arr[i] == "gets" || essay_arr[i] == "got" || essay_arr[i] == "getting" || essay_arr[i] == "gotten")  {
            // console.log(essay_arr[i]);
            point_loss += 1;
        }
    }
    // console.log("nnn loss " + point_loss)
    var reason = " " + point_loss + " points taken off for nasty no-nos";
    reasons.push(reason);
    return point_loss;
}

// for every word in unique words we check spelling 
function spelling_rule(essay) {
    var point_loss = 0;
    for (let [key, value] of unique_words) {
        var word = key;
        if (key.charAt(key.length-1) === "." || key.charAt(key.length-1) === "?" || key.charAt(key.length-1) === "!") {
            word = key.substring(0, key.length-1);
        }
        // console.log(word);
        // console.log(word.toLowerCase());
        word = word.toLowerCase();
        if (word != "" && !all_words.has(word)) {
            console.log("point " + word + " " + value)
            point_loss += value;
        }
    }
    console.log("spelling loss" + point_loss);
    var reason = " " + point_loss + " points taken off for spelling mistakes";
    reasons.push(reason);
    return point_loss;
    
}

// 3% off for a pair of sentences starting with the same word, separated by no more than 3 sentences in between, exclusive. No double counting the pair.

function startingword_rule(essay) {
    var point_loss = 0;
    var starting_words = [];
    var count = 0;
    for (var i = 0; i < essay_arr.length-1; i++) {
        var w = essay_arr[i];
        var word = w;

        if (w.charAt(w.length-1) === "." || w.charAt(w.length-1) === "?" || w.charAt(w.length-1) === "!") {
            count++; // sentence number for next sentence
            word = w.substring(0, w.length-1);
            var first_word = essay_arr[i+1];
            // gets the first word of the next sentence
            var j = 0;
            if ((count-4) > 0) {
                j = count-4;
            }
            for (k = j; k < starting_words.length; k++) {
                if (starting_words[k] === first_word) {
                    point_loss+=3;
                    // console.log(first_word);
                }
            }
            starting_words[i] = first_word;
        }
        
        // if last char of word is punctuation
    }
    // console.log("sentence start loss " + point_loss);
    var reason = " " + point_loss + " points taken off for sentence starting";
    reasons.push(reason);
    return point_loss;
}
