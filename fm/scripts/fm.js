const calculate = document.getElementById('calculate');
const tarIntRate = document.getElementById('tarIntRate');
const numberInput = document.querySelectorAll('[type="text"]');

const focusHandler = event => {
  event.target.className = 'highlight';
};

const blurHandler = event => {
  event.target.className = '';
};

numberInput.forEach( element => element.addEventListener('focus', focusHandler) );
numberInput.forEach( element => element.addEventListener('blur', blurHandler) );


function iconv(intRate, srcComp, tarComp) {

    if (srcComp && tarComp && intRate) {
        intRate /= 100
        const convIntRate = tarComp * (Math.pow((1 + intRate/srcComp), (srcComp/tarComp)) - 1);
        return convIntRate * 100;
    } else {
        return "Some values are missing!";
    }
};

calculate.addEventListener('click', () => {

    const intRate = parseFloat(document.querySelector('#intRate').value);
    const srcComp = parseFloat(document.querySelector('#srcComp').value);
    const tarComp = parseFloat(document.querySelector('#tarComp').value);

    tarIntRate.textContent = iconv(intRate, srcComp, tarComp);
});
