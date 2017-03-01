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

//////////////////   SICP ///////////////////////////

function fixed_point(f,start,tolerance) { 
	var closeEnough = function(u,v) { return Math.abs(u-v)<tolerance; };
	if( closeEnough(start, f(start))) { return start;} 
	else { console.log("Last value: " + start); return fixed_point(f, f(start), tolerance);} 
}

function averageDamp(f) {
	// private function 
    var average=function(x, y) { return (x+y)/2; }
	
    function sqrt(x) { 
	   // private function to average damp - the function whose fixed point approaches the value of square root
	   var f=function(y) {return x/y}; 
	   return fixed_point(averageDamp(f), 1, 0.00001); 
    }
    
	return function(x) {
		return average(x, f(x));
	};
}



function derivative (f) {
	return function(x) {
		var dx = 0.0001;
		return (f(x)-f(x+dx))/dx;
	};
}

function newtonMethod(f, x) {
	var df = derivative(f);	
	return fixed_point(function(y) { return y - f(y)/df(y);} , x, 0.0001);
}

/**
* determines if n is a power of 2
*/
function isP2(n) { 
	return (n & (n - 1)) == 0;
}

function gcd2(x,y) {
	var lesser = x>y ? y : x;
	var greater = x>y? x : y;
	
	if(greater%lesser ==0) return lesser;
	
	var x=1;
	var gcdNum = 1;	
	
	while(Math.floor(lesser/x++)>1) {
		var mod1, mod2;
		if(isP2(x)) {
			// x is a power of two
			mod1 = greater & (x-1);
			mod2 = lesser & (x-1);
		} else {
			mod1 = greater%x;
			mod2 = lesser%x
		}
		
		if(mod1 ==0 &&  mod2 == 0) {
			gcdNum*= x;
			greater/=x;
			lesser/=x;
			x=1;
		}
	}
	return gcdNum;
}

function cons(a,b) {
	return function(x) {
	    if(x!=1 && x!=2) throw new Error("Arguments can only be 1 or 2");
		return x==1? a: b;
	};
}

function car(f) {
	if(f==null) { return null; /* reached end of the list */ }
	if(typeof f!=='function') throw new Error("Invalid object used as argument");
	return f(1);
}

function cdr(f) {
	if(f==null) { return null; /* reached end of the list */ }
	if(typeof f!=='function') throw new Error("Invalid object used as argument");
	return f(2);
}

function list() {
	if(arguments.length==0) {
		return null;
	} else {
		return cons( arguments[0], arguments.callee.apply(this, Array.prototype.slice.call(arguments,1)));
	}
}




