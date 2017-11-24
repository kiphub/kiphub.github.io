// I hate dealing with default parameters in javascript.

'use strict';

define(["./lifetables"], function (lifetables) {

    const LIFETABLE = lifetables.ILT;  // change this when switching lifetables.
    const MAXAGE = Object.keys(LIFETABLE).slice(-1)[0];
    const FUNCTIONS = {

        iconv: function (intRate=0.06, srcComp, tarComp) {

            // If comp's are `nan` or `0`, make them 1.
            srcComp = srcComp || 1;
            tarComp = tarComp || 1;

            if (isFinite(srcComp) && isFinite(tarComp)){
                // finite -> finite
                var convIntRate = tarComp * (Math.pow( (1 + intRate/srcComp), (srcComp/tarComp) ) - 1);

            } else if ( ! isFinite(srcComp) && isFinite(tarComp) ) {
                // infinite -> finite
                var convIntRate = tarComp * (Math.exp(intRate / tarComp) - 1);

            } else if ( ! isFinite(tarComp) ) {
                // finite -> infinite
                var convIntRate = srcComp * Math.log(1 + intRate / srcComp);

            } else {
                // A catch-all solution.
                var convIntRate = intRate;
            }

            return convIntRate;
        },

        l: function (x=0, assumption="UDD") {
            // assumption required for fractional ages.
            // assumption = "UDD" || "CFM"
            // `l()` returns the radix.

            let n = Math.floor(x);  // Get the integer part of x.
            let s = x - n;  // Get the decimal part of x.

            if ( s ) {
                // If x is not an integer
                let lower = LIFETABLE[n];
                let upper = LIFETABLE[n + 1];

                if (assumption === "UDD") {
                    return lower * (1 - s) + upper * s;  // linear interpolation
                } else if (assumption === "CFM") {
                    return lower ** (1 - s) * upper ** s;  // exponential interpolation
                } else {
                    console.error(`${assumption} is an invalid assumption.`)
                }

            } else {
                // If x is an integer (in which case x === n)
                return LIFETABLE[n];
            }
        },

        d: function (x, n=1, assumption="UDD") {
            // assumption required for fractional ages.
            // assumption = "UDD" || "CFM"

            let l = FUNCTIONS.l;

            return l(x, assumption) - l(x + n, assumption);
        },

        p: function (x, t=1, assumption="UDD") {
            // assumption required for fractional ages.
            // assumption = "UDD" || "CFM"

            let l = FUNCTIONS.l;

            return l(x + t, assumption) / l(x, assumption);
        },

        q: function (x, t=1, assumption="UDD") {
            // assumption required for fractional ages.
            // assumption = "UDD" || "CFM"

            return 1 - p(x, t, assumption);
        },

        e: function (x, n=MAXAGE-x, assumption="UDD") {
            // curtate life expectancy by default.
            // assumption required for complete life expectancy
            // assumption = "UDD" || "CFM"
            // WIP feature

            let p = FUNCTIONS.p;

            let sum = 0;

            // Summ of p(x, t) for t from 1 to n.
            for (let i = 1; i <= n; i++) {
                sum += p(x, i, assumption);
            }

            return sum;
        },

        E: function (x, term=Infinity, interest=0.06) {
            // The EPV of a pure endowment with benefit of 1.
            // return 0 if term === Infinity; return 1 if term === 0.

            let p = FUNCTIONS.p;

            return (1 + interest) ** (-term) * p(x, term);  // v^n * npx
        },

        A: function ({x, term=MAXAGE - x, deferral=0, interest=0.06, endowment=false} = {}) {

            let l = FUNCTIONS.l;
            let p = FUNCTIONS.p;
            let E = FUNCTIONS.E;

            term -= deferral;

            let evalAge = x + deferral;  // The age at which the EPV is actually evaluated.

            var epv = 0;  // FUNCTIONS is evantually the desired EPV.

            for (let t = 0; t < term; t++) {
                //    1
                // A(x+m, n)
                epv += (1 + interest) ** -(t + 1) * ( p(evalAge, t) - p(evalAge, t + 1) );

            }

            //     1                1
            // m|A(x, n) = mEx * A(x+m, n)
            epv *= E(x, deferral, interest);

            if (endowment) {
                // If it's an endowment insurance, then:
                //
                //                 1
                // m|A(x, n) = m|A(x, n) + (n+m)E(x)
                epv += E(x, term + deferral, interest);
            }
            return epv;

        },

        Am: function ({x, deferral=0, term=MAXAGE-x, interest=0.06, endowment=false, assumption, m} = {}) {
            // `assumption` = "UDD" || "acceleration".
            // `m` can be `Infinity`.

            let iconv = FUNCTIONS.iconv;
            let A = FUNCTIONS.A;
            let E = FUNCTIONS.E;

            let evalAge = x + deferral;  // The age at which the EPV is actually evaluated.
            term -= deferral;

            if (assumption === "UDD") {

                var convFactor = interest / iconv(interest, 1, m);

            } else if (assumption === "acceleration") {

                if (! isFinite(m)) {
                    // If `m` is `Infinity`
                    var convFactor = (1 + interest) ** 0.5;

                } else {

                    var convFactor = (1 + interest) ** ( (m - 1)/(2 * m) );
                }

            } else {
                // Probably should throw an error. But I don't know how to do that yet.
                console.error(`${assumption} assumption is not supported.`);

                var convFactor = 1;

            }  // End of the assumption check.

            if (endowment) {
                // Apply `convFactor` only to the term part.
                return convFactor * A({x:evalAge, term:term, deferral:deferral, interest:interest, due:false}) + E(x, deferral + term);
            } else {
                return convFactor * A({x:evalAge, term:term, deferral:deferral, interest:interest, due:false});
            }
        },

        a: function ({x, term=MAXAGE - x, deferral=0, interest=0.06, due=true} = {}) {
            // EPV of an annuity.

            let A = FUNCTIONS.A;
            let E = FUNCTIONS.E;
            let iconv = FUNCTIONS.iconv;

            let evalAge = x + deferral;

            term -= deferral;

            let epv = ( 1 - A({x:evalAge, term:term, deferral:0, interest:interest, endowment:true}) ) / iconv(interest, 1, -1);

            if (! due) {
                epv += E(evalAge, term, interest) - 1;
            }

            return epv * E(x, deferral);
        },

        am: function ({x, term=MAXAGE - x, deferral=0, interest=0.06, due=true, assumption, m} = {}) {
            // assumption = "W2" || "W3" || "UDD"

            /**
             * Personally, I've never seen a case where both term and deferral
             * appear simultaneously, but I still included this possibility
             * for completeness.
             */

            let a = FUNCTIONS.a;
            let iconv = FUNCTIONS.iconv;

            term -= deferral;

            function wholeLifeAnnuity(age) {
                // Convert to m-thly whole life annuity.
                // Should I explain more on this?

                // Approximate the force of mortality.
                let mu = - 0.5 * ( Math.log( p(age - 1) ) + Math.log( p(age) ) );
                let delta = iconv(interest, 1, Infinity);
                let d = iconv(interest, 1, -1);
                let im = iconv(interest, 1, m);
                let dm = iconv(interest, 1, -m);

                // First calculate the coefficients
                if ( ["W2", "W3"].includes(assumption) ) {

                    if ( isFinite(m) ) {
                        var coef1 = (m - 1) / (2 * m);
                        var coef2 = (m ** 2 - 1) / (12 * m ** 2) * (delta + mu);
                    } else {
                        var coef1 = 1/ 2;
                        var coef2 = 1 / 12 * (delta + mu);
                    }

                    if (assumption === "W2") {
                        return a({x:age, interest:interest}) - coef1;
                    } else {
                        return a({x:age, interest:interest}) - coef1 - coef2;
                    }

                } else if (assumption === "UDD") {

                    if ( isFinite(m) ) {
                        var denom = im * dm;
                        var coef0 = ( interest * d ) / denom;  // alpha(m)
                        var coef1 = ( interest - im ) / denom;  // beta(m)
                    } else {
                        var denom = delta ** 2;
                        var coef0 = ( interest * d ) / denom;  // alpha(m)
                        var coef1 = ( interest - delta ) / denom;  // beta(m)
                    }

                    return coef0 * a({x:age, interest:interest}) - coef1;

                }
            } // End of the local function

            return E(x, deferral, interest) * ( wholeLifeAnnuity(x + deferral) - E(x + deferral, term, interest) * wholeLifeAnnuity(x + deferral + term) );
        },

        P: function ({x, term=MAXAGE-x, deferral=0, interest=0.06, endowment=false} = {}) {
            // Return the net premium determined by the equivalent principle.

            let a = FUNCTIONS.a;
            let A = FUNCTIONS.A;
            let E = FUNCTIONS.E;

            if (deferral) {
                // If deferral is provided, assume that the premiums are payed during the deferral period.
                var epvPremiums = a({x: x, term: deferral, interest: interest});
            } else {
                // If there is no deferral, then the term is the same as that of the benefits.
                var epvPremiums = a({x: x, term: term, interest: interest});
            }

            let epvBenefits = A({x: x, term: term, deferral: deferral, interest: interest, endowment: endowment});

            return epvBenefits / epvPremiums;

        },

        V: function ({x, t=0, term=MAXAGE-x, deferral=0, interest=0.06, endowment=false, premium=null /*, FPT=false? */} = {}){
            // Return the net premium reserve for whole life, term, and deferred contracts.
            // Using the equivalent princples.
            // Using the prospective method.

            let P = FUNCTIONS.P;
            let A = FUNCTIONS.A;
            let a = FUNCTIONS.a;

            // If premium is not given, use the premium determined by the equivalent principle.
            premium = premium || P({x: x, term: term, deferral: deferral, interest: interest, endowment: endowment});

            if ( t < deferral) {
                // If the policy is still in the deferral period...
                let epvFuturePremiums = a({x: x+t, term: deferral-t, interest: interest});
                let epvFutureBenefits = A({x: x+t, term: term, deferal: deferral-t, interest: interest, endowment: endowment});

                return epvFutureBenefits - premium * epvFuturePremiums;

            } else if (deferral){
                // If the policy is passed the deferral period, and the deferral period is not 0, then there is no future premiums.
                let epvFuturePremiums = 0;
                let epvFutureBenefits = A({x: x+t, term: term-t, interest: interest, endowment: endowment});

                return epvFutureBenefits - premium * epvFuturePremiums;

            } else {
                // If no deferral period is given, then the premiums are paid paid before the end of the term.
                let epvFuturePremiums = a({x: x+t, term: term-t, interest: interest});
                let epvFutureBenefits = A({x: x+t, term: term-t, interest: interest, endowment: endowment});

                return epvFutureBenefits - premium * epvFuturePremiums;
            }
        },

    };

    return FUNCTIONS;

    // console.log(am(x=20, assumption="UDD", interest=0.1, term=10, m=12))
    // function test() {
    //     // Test for `am`
    //     let assumptions = ["UDD", "W2", "W3"];
    //     let ages = [20, 30, 40, 50, 60, 70];
    //
    //     for (let i = 0; i < assumptions.length; i++) {
    //         for (let j = 0; j < ages.length; j++) {
    //             console.log(`${assumptions[i]}, ${ages[j]}: ${am({x: ages[j], assumption: assumptions[i], term: 25, interest: 0.05, m: 2})}`)
    //         }
    //     }
    // }

    // test()

    // console.log(10000 * V({x: 50, t: 10, term: 20, deferral: 15}))

    // exports = {iconv, l, d, p, q, e, E, A, Am, a, am, P, V};

});
