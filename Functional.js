/**
 *  Find fixed point of a function
 * @param f  function param
 * @param start  where to start
 * @param precision
 * @return {*}
 */
function fixedPoint(f, start, precision) {
   var oldVal = start;
   var newVal = f(start);
   while(Math.abs(oldVal - newVal) > precision) {
       oldVal = newVal;
       newVal = f(oldVal);
   }
   return newVal;
}

/**
 * Approximating square root by Heron's method
 * @param x
 * @param precision
 * @return {*}
 */
function sqrt (x, precision) {
    var average = function(a, b) { return (a+b)/2; };
    return fixedPoint (
        function(y) {
            return average(x/y, y );
        }, 1, precision);
}

/**
 *  generic summing of the type
 *
 *   _ b_ _
 *   \
 *    \      f(i)
 *    /
 *   /_ _ _
 *     i=a
 *
 *  @param a starting point
 *  @param b end point
 *  @param f function to apply to each term
 *  @param next function that is a rule for deriving next a (aka, only do even numbers, n+1 or n+4
 *
 */
function sum (a, b, f, nextA )  {
    if(a > b) return 0;  // reached base case
    return (f(a) + sum(nextA(a), b, f, nextA));
}

/**
 *
 * @param a start
 * @param b end
 * @return {Number}
 */
function sumInt(a, b) {
    return sum(a, b, /* identity function */ function(x){return x}, /* increment function */ function(x){ return ++x} );
}

/**
 *
 * @param a
 * @param b
 * @return {*}
 */
function sumSquares(a,b) {
    return sum(a,b, function(x){return x*x}, function(x){ return ++x;});
}

/**
 * fib O(n)
 * @param i
 * @return {*}
 */
function fib(i) {
    if(i<2) return i;
    var prev = 0;
    var cur = 1;
    var x =1;

    while(x++<i) {
        cur = prev + (prev=cur) ;
    }
    return cur;
}

/**
 *
 * @param f function to differentiate
 * @param dx arbitrary small delta x
 * @return {Function}
 */
function derivativeN (f, dx, n) {
    if(!dx) dx =1; // prevent div by zero

    var f_deriv =  function(x) {
        return ( f(x+dx) - f(x) ) * (1/dx);
    };

    if(!n || n<1) {n = 0;} // validation for base case

    return n? derivativeN(f_deriv, dx, n-1) : f_deriv;
}

/**
 * greatest common divisor of two numbers by Euclid's division
 * @param x
 * @param y
 */
function gcd(x, y) {
    if(y == 0) return x;
    return gcd(y, x % y);
}

/**
 *  Rational number "data structure" in the form of a function
 * @param n
 * @param d
 * @return {Function}
 */
function makeRat(n, d) {
    return function(index) {
        var g = gcd(n,d);
        return index==0? n/g: d/g;
    }
}

function numer(r) {
    return r(0);
}

function denom(r) {
    return r(1);
}

function addRat(x, y) {
    return makeRat(numer(x) * denom(y) + numer(y)*denom(x) , denom(x) * denom(y));
}

function multRat(x, y) {
    return makeRat(numer(x) * numer(y) , denom(x) * denom(y));
}

