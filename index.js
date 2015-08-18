var docGen = require('./docGenerator.js');
var fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', function () {
    var reader = new FileReader();
    var file = fileInput.files[0];
    reader.onload = function () {
        console.log(reader.result)
    };
    console.log(file)
    reader.readAsText(file);
});