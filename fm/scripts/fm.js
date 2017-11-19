
const myButton = document.getElementById('myButton');
var tarIntRate = document.getElementById('tarIntRate');

function iconv(intRate, srcComp, tarComp) {

    var convIntRate = tarComp * (Math.pow((1 + intRate/srcComp), (srcComp/tarComp)) - 1);

    return convIntRate;
};


myButton.addEventListener('click', () => {
    
    var intRate = parseFloat(document.getElementById('intRate').value);
    var srcComp = parseFloat(document.getElementById('srcComp').value);
    var tarComp = parseFloat(document.getElementById('tarComp').value);

    tarIntRate.textContent = iconv(intRate, srcComp, tarComp);
});
