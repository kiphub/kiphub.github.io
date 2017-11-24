
define(function (require) {

    const l = require("./functions").l,
          d = require("./functions").d,
          p = require("./functions").p,
          q = require("./functions").q,
          e = require("./functions").e,
          A = require("./functions").A,
          E = require("./functions").E,
          Am = require("./functions").Am,
          a = require("./functions").a,
          am = require("./functions").am,
          P = require("./functions").P,
          V = require("./functions").V;

    const userInput = document.querySelector("#userInput");
    const submit = document.querySelector("#submit");
    const commandOutput = document.querySelector("#commandOutput");

    submit.addEventListener('click', () => {
        commandOutput.textContent = eval(userInput.value);

    });

});
