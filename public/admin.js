table = document.getElementById("gradestable");

function httpGetAsync(theUrl, callback) {
  let xmlHttpReq = new XMLHttpRequest();
  xmlHttpReq.onreadystatechange = function () {
    if (xmlHttpReq.readyState == 4 && xmlHttpReq.status == 200)
      callback(xmlHttpReq.responseText);
  }
  xmlHttpReq.open("GET", theUrl, true); // true for asynchronous 
  xmlHttpReq.send(null);
}

httpGetAsync('http://localhost:2020/getgrades', function(result){
    console.log(result);
    //update the table
    grades = JSON.parse(result).grades;
    grades.forEach(element => {
      var row = table.insertRow(1);
      var namecell = row.insertCell(0);
      var gradecell = row.insertCell(1);
      namecell.innerHTML = element.name;
      gradecell.innerHTML = element.score;

    });

});
