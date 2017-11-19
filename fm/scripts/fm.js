
const myButton = document.getElementById('myButton');
const tarIntRate = document.getElementById('tarIntRate');

function iconv(intRate, srcComp, tarComp) {

    if (srcComp && tarComp && intRate) {
        intRate /= 100
        const convIntRate = tarComp * (Math.pow((1 + intRate/srcComp), (srcComp/tarComp)) - 1);
        return convIntRate;
    } else {
        return intRate;
    }
};


myButton.addEventListener('click', () => {

    const intRate = parseFloat(document.querySelector('#intRate').value);
    const srcComp = parseFloat(document.querySelector('#srcComp').value);
    const tarComp = parseFloat(document.querySelector('#tarComp').value);

    tarIntRate.textContent = iconv(intRate, srcComp, tarComp);
});
