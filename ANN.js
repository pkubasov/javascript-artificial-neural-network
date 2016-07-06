/******************************************************************************
*
*     This file demonstrates a possible implementation of a neural network
*     algorithm inspired by the biological phenomenon of interneuronal communication
*     in the brain.
*
*     For a detailed treatment of the subject, check out docs/neuron.pdf file.
*
*     This implementation allows one to create an n-level neural network for signal processing
*     
*     File is organized as follows:
*
*      1) makeNeuron function - main constructor function that creates a Neuron object with all of the APIs 
*      needed for interneuronal communication.
*      
*      2) makeSensor function - constructor for creating sensors for sensory neurons (lowest level) 
*      
*      3) makeSignal function - abstraction for creating signals that will be channeled between neurons
*      
*      4) test function that demonstrates sample usage
*
*      5) Misc helper functions
*
*
*******************************************************************************/

function makeNeuron( name, threshold) {

    /*
        Neuron constructor function
     */
    function Neuron( name, threshold ) {

        // initialize private vars
        var lastReceivedSignalTimestamp = null;
        var lastSentSignalTimestamp = null;
        // what we got
        var lastReceivedSignalValue = 0;
        // what we sent
        var lastSentSignalValue = 0;

        /**
         *  This is a map of signal type (aka name) to their respective weight
         *
         * @type {Object}
         */
        var weightMatrix = {};

        /**
         *  This is a stack of received signals stored as Signal objects
         *  Using the "type" attribute of Signal, look-ups can be made to find associated weight in weightMatrix
         *
         * @type {Array}
         */
        var signalsQueue = [];

        /**
         * Neurons connected to this neuron. Need this to do back propagation training
         * @type {Array}
         */
        var neuronSynapses = [];

        /**
         * neuron axon represents the output mechanism of a neuron
         * (as opposed to neuron dendrite which is the input mechanism)
         *
         * @type {HTMLElement}
         */
        var neuronAxon = buildElement(name, 0);
        neuronAxon.neuron = this;

        // initialize object
        this.name = name;

        /**
         * This value is critical to neuron's ability to "fire" an action potential
         * This is the value that must be exceeded by the result of the activation function
         * @type {Number}
         */
        this.threshold = threshold;

        // set up functional parts of this neuron

        /**
         * Sets input weights
         * @param name
         * @param weight
         */
        this.setWeight = function ( name, weight) {
            weightMatrix[name] = weight;
        };

        /**
         * This is used to normalize inputs
         * Should be only used by sensory neurons, since all other neursons get signsals of 1*weight or 0.
         * @param min
         * @param max
         */
        this.setScale = function (min, max) {
            this.min = min;
            this.max = max;

        };

        this.getWeight = function ( name) {
            return weightMatrix[name]=== undefined? 1 : weightMatrix[name];
        };

        /**
         *  This is the analog "action potential" firing in the neuron
         */
        this.sendSignal = function() {

            // output is either nothing or 1; weights factor in to create relative significance of each input
            var outputValue = 1;

            log(this.name + " setting value of the axon to " + outputValue);
            /*
                    the output is always smoothed to -1,0,1 and is scaled appropriately via weights for specific neuron inputs
             */
            neuronAxon.setAttribute("value", outputValue);
            log(this.name + " sending neural event");
            neuronAxon.dispatchEvent(getNeuralEvent());

            // re-initialize state of the neuron
            lastSentSignalTimestamp = new Date();
            lastSentSignalValue = 1;
            lastReceivedSignalValue = 0; // reset to "resting potential"
        };

        /**
         *  This is where signals are integrated and processed on each excitation (aka signal being received)
         */
        this.processSignals = function() {
            log(this.name + " result of activation function: " + this.activationFunction( lastReceivedSignalValue ));
            log(this.name + " threshold: " + this.threshold);
            if( this.activationFunction( lastReceivedSignalValue ) >= this.threshold ) {
                this.sendSignal();
            } else {
                lastSentSignalValue = 0;
            }
        };

        /**
         * @param val Received value, not output value
         * Default implementation simply adds to existing value
         * More sophisticated neurons take into account temporal dimension of how close the signals are to each other
         */
        this.processReceivedValue = function( val ) {
            lastReceivedSignalValue += val;
            log("Value of " + this.name + " is set to " + lastReceivedSignalValue);
            lastReceivedSignalTimestamp = new Date();
        };

        /**
         * This is a virtual "dendrite" part of the neuron, it receives inputs from sensors or other neurons
         *
         * @param e DOMEvent
         */
        this.signalReceptor = function( e ) {

            var signalName = e.srcElement.getAttribute("name");
            log("Received signal from " + signalName);
            var weight =  this.getWeight(signalName);
            log("Using weight of " + weight);
            var originalValue = e.srcElement.getAttribute("value");
            var normalizedValue = this.normalize(originalValue, this.max, this.min);
            log("Original value: " + originalValue );
            log("Normalized value: " + normalizedValue);
            log("Weighted value: " + normalizedValue* weight);

            signalsQueue.push(makeSignal(signalName, originalValue, normalizedValue))

            this.processReceivedValue(normalizedValue * weight);
            this.processSignals();
        };

        /**
         *  This is where neuron dendrite connects directly to sensory data
         *
         * @param {DOMElement} elem
         * @param weight
         */
        this.registerSensor = function( elem, weight) {
            var j = this; // silly js stuff

            // start listening for events from this sensor
            elem.addEventListener("neuralEvent", function(e) {
                j.signalReceptor.apply(j, arguments);
            });
            this.setWeight(elem.getAttribute("name"), weight);
            if(elem.neuron) {
                neuronSynapses.push(elem.neuron);
            }
        };

        /**
         * This is a neuron-neuron (hidden layer) connection,
         * Here we are connecting "this" neuron's axon to the synapse of another neuron
         *
         * @param neuron Neuron to send input to
         * @param weight
         */
        this.registerNeuronConnection = function ( neuron, weight) {
            neuron.registerSensor(neuronAxon, weight);
        };

        /**
         *  Displays all received signals up-to-date
         */
        this.showSignalQueue = function() {
            log(" Signals received by " + this.name + " starting from most recent:")
            for(var i = signalsQueue.length; i>0; ) {
                 log(signalsQueue[--i].toString());
            }
        }

        /**
         *
         * @param expectedValue
         * @param learningRate
         */
        this.train = function( expectedValue, learningRate) {

            log("Commencing training exercises of " + this.name +  " with learning rate of " + learningRate + "!", 3);

            // this is "y", the actual value this neuron produced last
            var outputValue = lastSentSignalValue;
            log("Last output value was " + outputValue, 4);
            log("Last expected value was " + expectedValue, 4);

            // this is not a sensory neuron
            if(neuronSynapses.length > 0 ) {
                for(var i = 0; i < neuronSynapses.length; i++) {
                    var n_i = neuronSynapses[i]; //ith neuron
                    var w_i = weightMatrix[n_i.name];  // ith weight
                    log("Current weight of input from " + n_i.name + " is set to " + w_i, 4);
                    var x_i = 0; // ith input
                    var found = false;
                    for(var j = signalsQueue.length-1; j>0; j--) {
                        if(signalsQueue[j].name == n_i.name) {
                            found = true;
                            log("Found matching signal: ")
                            log(signalsQueue[j].toString());
                            x_i = signalsQueue[j].normalizedValue;
                            break;
                        }
                    }
                    if(!found) {
                        log("No signals from " + n_i.name + "; will not update weights, but will recursively train it", 3);
                        n_i.train(expectedValue, learningRate);
                        continue;
                    }

                    // update ith weight
                    var w_delta = learningRate * (expectedValue - outputValue) * this.activationFunctionDerivative(x_i);
                    weightMatrix[n_i.name]+=w_delta;
                    log("Weight delta is " + w_delta + " and new weight of input from " + n_i.name + " is now " + weightMatrix[n_i.name], 4);

                    // now recursively train this neuron
                    n_i.train(expectedValue, learningRate);
                }
            } else {
                // sensory neuron - need to update weights for all sensory connections and quit
                // because we have reached the bottom layer - the input layer
                for(var prop in weightMatrix) {
                    var x_i = null;
                    if(weightMatrix.hasOwnProperty(prop) && weightMatrix[prop]) {
                        var found = false;
                        for(var j = signalsQueue.length-1; j>0; j--) {
                            if(signalsQueue[j].name == prop) {
                                found = true;
                                log("Found matching signal: ")
                                log(signalsQueue[j].toString());
                                x_i = signalsQueue[j].normalizedValue;

                                log("Current weight of input from " + prop + " is set to " + weightMatrix[prop], 4);
                                break;
                            }
                        }
                        if(!found) {
                            log("No signals from " + prop);
                            continue;
                        }

                        // update ith weight
                        var w_delta = learningRate * (expectedValue - outputValue) * this.activationFunctionDerivative(x_i);
                        weightMatrix[prop]+=w_delta;
                        log("Weight delta is " + w_delta + " and new weight of input from " + prop + " is now " + weightMatrix[prop], 4);
                    }
                }

            }

            // clear signals queue
            signalsQueue = [];

            log("Done training " + this.name, 4);
        }

    } // end constructor

    var n = new Neuron( name, threshold );

    // set default scale
    n.setScale(0,1,1);

    /**
     *  Tangental sigmoidal activation function
     *
     * @param val
     * @return {Number}
     */
    Neuron.prototype.activationFunction = function( val ) {
        var retVal = (Math.pow(Math.E, val) - Math.pow(Math.E, val*(-1))) / (Math.pow(Math.E, val) + Math.pow(Math.E, val*(-1)));
        // if we exceeded the scale, just use step function
        if(isNaN(retVal)) {
             if(val>0) return 1;
             return 0;
        } else {
            return retVal;
        }
    };

    /**
     * Derivative of activation function which is used in calculation of error
     *
     * @param val
     * @return {Number}
     */
    Neuron.prototype.activationFunctionDerivative = function( val ) {
        return 1- Math.pow(this.activationFunction(val), 2);
    };

    /**
     *  this could be overridden by specific neurons to suit their particular normalization logic
     *
     * @param input  value to normalize
     * @param max    max range
     * @param min    min range
     * @return {*}   normalized value
     */
    Neuron.prototype.normalize = function ( input, max, min) {
        if(isNaN(input)) return 0;
        if(max == undefined || min == undefined || max==min) {
            return input;
        }  else {
            // scale
            return (input - min)/(max - min);
        }
    };

    return n;
}

function makeSignal(name, value, normalizedValue) {
    function Signal(name, value) {
        this.name = name;
        this.value = value;
        this.normalizedValue = normalizedValue===undefined? value: normalizedValue ;
        this.timestamp = new Date();
    }

    var s = new Signal(name, value, normalizedValue);

    Signal.prototype.toString  = function() {
        return " Signal name is: " + this.name + "; signal value is: " + this.value +  "; normalized value is: " + this.normalizedValue +
            " ; signal timestamp is: " + this.timestamp.getMinutes() + ":" + this.timestamp.getSeconds() + ":" + this.timestamp.getMilliseconds();
    };

    return s;
}

function makeSensor(name, initialValue) {

    var element = buildElement(name, initialValue);
    element.triggerSensor  = function (inputValue) {
        this.setAttribute("value", inputValue);
        this.dispatchEvent(getNeuralEvent());
    };
    return element;
}

function buildElement(name, value) {
    var element =  document.createElement("input");
    element.setAttribute("hidden", true);
    element.setAttribute("name", name);
    element.setAttribute("value", value);
    document.firstChild.appendChild(element);
    return element;
}

function testLetterRecognition() {
    // first layer neurons - aka sensory neurons

    /**
     *  Here is what we need to detect:
     *
     *   ____
     *  |
     *  |___
     *  |
     *  |____
     *
     *  we'll have 4 sensory neurons - one for each bar - 1 long vertical, 3 short horizontal
     *
     *  1 long vertical bar sensory neuron has 2 sensory inputs -
     *          angle (alpha) wrt x-axis, and
     *          dy (height)
     *  3 short horizontal bar sensory neurons will have 4 inputs each -
     *          angle (theta) wrt to 1st bar,
     *          dy (distance from lowest point of 1st bar - y_min),
     *          x_0 (where the bar starts)
     *          x_1 (where the bar ends)
     *  the coordinate system assumes that lowest point of bar1 is the (0,0) point
     *
     *  The point is to train the system to recognize E's that are somewhat rotated, imprecise in length of vertical bars, uneven , etc.
     *
     */


    // let's make some sensory neurons with pre-defined thresholds
    n1 = makeNeuron("vBar", 0.85 );
    n2 = makeNeuron("upperHBar", 0.75);
    n3 = makeNeuron("middleHBar", 0.75);
    n4 = makeNeuron("lowerHBar", 0.75);

    // set min and max
    // this is used to normalize inputs into a particular scale
    // 2 pi = largest angle, 1 - largest unit value of a bar
    n1.setScale(0, 2*Math.PI);
    n2.setScale(0, 2*Math.PI);
    n3.setScale(0, 2*Math.PI);
    n4.setScale(0, 2*Math.PI);

    // sensors - translate stimuli into neural excitation
    s1 = makeSensor("vBarAngle");
    s2 = makeSensor("vBarLength");

    s3 = makeSensor("upperHBarAngle");
    s4 = makeSensor("upperHBarDY");
    s5 = makeSensor("upperHBarX0");
    s6 = makeSensor("upperHBarX1");

    s7 = makeSensor("middleHBarAngle");
    s8 = makeSensor("middleHBarDY");
    s9 = makeSensor("middleHBarX0");
    s10 = makeSensor("middleHBarX1");

    s11 = makeSensor("lowerHBarAngle");
    s12 = makeSensor("lowerHBarDY");
    s13 = makeSensor("lowerHBarX0");
    s14 = makeSensor("lowerHBarX1");

    // connect sensors to their neurons
    n1.registerSensor(s1, Math.random());
    n1.registerSensor(s2, Math.random());

    n2.registerSensor(s3, Math.random());
    n2.registerSensor(s4, Math.random());
    n2.registerSensor(s5, Math.random());
    n2.registerSensor(s6, Math.random());

    n3.registerSensor(s7, Math.random());
    n3.registerSensor(s8, Math.random());
    n3.registerSensor(s9, Math.random());
    n3.registerSensor(s10, Math.random());

    n4.registerSensor(s11, Math.random());
    n4.registerSensor(s12, Math.random());
    n4.registerSensor(s13, Math.random());
    n4.registerSensor(s14, Math.random());

    // now create the hidden layer neurons
    n5 = makeNeuron("hiddenLayer1", 0.75);
    n6 = makeNeuron("hiddenLayer2", 0.75);
    n7 = makeNeuron("hiddenLayer3", 0.75);
    n8 = makeNeuron("hiddenLayer4", 0.75);

    // connect input to hidden layer
    n1.registerNeuronConnection(n5, Math.random());
    n1.registerNeuronConnection(n6, Math.random());
    n1.registerNeuronConnection(n7, Math.random());
    n1.registerNeuronConnection(n8, Math.random());

    n2.registerNeuronConnection(n5, Math.random());
    n2.registerNeuronConnection(n6, Math.random());
    n2.registerNeuronConnection(n7, Math.random());
    n2.registerNeuronConnection(n8, Math.random());

    n3.registerNeuronConnection(n5, Math.random());
    n3.registerNeuronConnection(n6, Math.random());
    n3.registerNeuronConnection(n7, Math.random());
    n3.registerNeuronConnection(n8, Math.random());

    n4.registerNeuronConnection(n5, Math.random());
    n4.registerNeuronConnection(n6, Math.random());
    n4.registerNeuronConnection(n7, Math.random());
    n4.registerNeuronConnection(n8, Math.random());


    // create the output layer
    n9 = makeNeuron("outputE", 0.60);
    n10 = makeNeuron("outputNonE", 0.60);

    // finally, connect neurons from hidden layer to neurons in output layer
    n5.registerNeuronConnection(n9, Math.random());
    n5.registerNeuronConnection(n10, (-1)* Math.random());

    n6.registerNeuronConnection(n9, Math.random());
    n6.registerNeuronConnection(n10,  (-1)* Math.random());

    n7.registerNeuronConnection(n9, Math.random());
    n7.registerNeuronConnection(n10,  (-1)* Math.random());

    n8.registerNeuronConnection(n9, Math.random());
    n8.registerNeuronConnection(n10,  (-1)* Math.random());

    // run training exercises to see if we can converge to correct answer
    for(x=0; x<100; x++) {
        setTimeout(function() {
            // 1st training set - perfect score
            s1.triggerSensor(Math.PI/2); // alpha
            s2.triggerSensor(n1.max);    // height

            s3.triggerSensor(Math.PI/2); // theta
            s4.triggerSensor(1)          // dy
            s5.triggerSensor(0);         // x_0
            s6.triggerSensor(n1.max*0.5);// x_1

            s7.triggerSensor(Math.PI/2);  // theta
            s8.triggerSensor(n1.max*0.5)  // dy
            s9.triggerSensor(0);          // x_0
            s10.triggerSensor(n1.max*0.5);// x_1

            s11.triggerSensor(Math.PI/2); // theta
            s12.triggerSensor(0)          // dy
            s13.triggerSensor(0);         // x_0
            s14.triggerSensor(n1.max*0.5);// x_1

            n9.train(1, 0.2);
            n10.train(0, 0.2);
        },11);

        // 2nd training set  - vertical bars short, angled up and down, uneven
        setTimeout(function(){
            s1.triggerSensor(Math.PI/2);
            // theta
            s2.triggerSensor(1);        // height

            s3.triggerSensor(85*Math.PI/360); // alpha
            s4.triggerSensor(n1.max*0.978)         // dy
            s5.triggerSensor(0);         // x_0
            s6.triggerSensor(n1.max*0.29);         // x_1

            s7.triggerSensor(Math.PI/2); // alpha
            s8.triggerSensor(n1.max*0.5)          // dy
            s9.triggerSensor(0);         // x_0
            s10.triggerSensor(n1.max*0.25);        // x_1

            s11.triggerSensor(95*Math.PI/360); // alpha
            s12.triggerSensor(0)          // dy
            s13.triggerSensor(0);         // x_0
            s14.triggerSensor(n1.max*0.32);         // x_1

            n9.train(1, 0.2);
            n10.train(0, 0.2);
        },13);
    }

    /*
        this is just for general debugging to ensure that
        signals are properly propagated through the system,
        don't use for training
    */
    /*
    var j = setInterval(function() {

        var rand = Math.random();
        if(rand > 0.5) return;

        for(var x = 1 ; x<15; x++) {
            var obj = eval("s" + x);
            obj.triggerSensor(Math.random() * 255);
        }
    }, 100);

    // stop after ~10 runs
    setTimeout(function(){
        clearInterval(j);
        n9.showSignalQueue();
        n10.showSignalQueue();
    }, 1000);

    */



}

(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();



// Event Object
function getNeuralEvent () {
    return new CustomEvent("neuralEvent", function(e) {
		console.log("Event called with target: " + e.target);
	});
}

LOG_LEVEL = 3;
function log(msg, level) {
   if(!level) level = 0; // DEBUG by default
   if(level >= LOG_LEVEL) console.log(msg);
}