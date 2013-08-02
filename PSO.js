/**
 * Created with IntelliJ IDEA.
 * User: PhilipK
 * Date: 7/31/13
 * Time: 9:44 AM
 * To change this template use File | Settings | File Templates.
 */

// namespace
var pso = {};

// globally scoped variables

/**
 * Determines the degree of social impact on particle's performance
 * @type {Number}
 */
pso.globalAcceleration = 0.595;
/**
 * Determines the degree of impact of particle's cognition of its own best results on its performance
 * @type {Number}
 */
pso.defaultLocalAcceleration = 0.985;
/**
 *  delta t, how long a particle is considered to run with current velocity
 * @type {Number}
 */
pso.timeIncrement = 1;
/**
 *  # of particles created (during test run or prod run)
 * @type {Number}
 */
pso.globalParticleCounter=0;
/**
 * total number of runs counter
 * @type {Number}
 */
pso.totalRuns = 0;
/**
 * array of test particles - used to access them for movement
 * @type {Array}
 */
pso.particles = [];
/**
 * test-specific array of interval Ids needed to stop the simulation when goal is reached
 * @type {Array}
 */
pso.intervals = [];
/**
 * determines the effect of current velocity on the next velocity value
 * @type {Number}
 */
pso.defaultInertia = 0.55;
/**
 * Max # of runs before we quit
 * @type {Number}
 */
pso.maxRuns = 10000;
/*
    goal parameters for testing
 */
pso.targetX = 600;
pso.targetY = 350;
pso.targetZ = -10;

// scoring vector
pso.Vector = function() {
    this.x = {
        result: 0, value : 0
    };
    this.y = {
        result: 0, value : 0
    };
    this.z = {
        result: 0, value : 0
    };
};

pso.gbest = new pso.Vector();

LOG_LEVEL = 1;
/**
 * General purpose logging function
 *
 * @param msg
 * @param level
 */
pso.log=function (msg, level) {
    if(!level) level = 0; // DEBUG by default
    if(level >= LOG_LEVEL) console.log(msg);
};

/**
 * Constructor for scorecard object that keeps track of particle's performance
 *
 * @param scoringFunction  function to use in evaluating performance
 * @param pbest  particle's localBest vector
 * @param particleName name of particle (used for logging)
 * @constructor
 */
pso.ScoreCard = function(scoringFunction, pbest, particleName) {
    this.particleName = particleName;
    //var timeSlot = new Array();
    this.pbest = pbest;

    this.addScore = function (val) {
        //timeSlot.push(val);
        pso.log("Current local best for " + this.particleName + " is x:" + this.pbest.x.value + ",y:" + this.pbest.y.value + ",z:" + this.pbest.z.value ,0);
        var result = this.scoringFunction(val);
        for(var i in result) {
            if(result.hasOwnProperty(i))  {
                // update local best
                if(this.pbest[i].result < result[i].result) {
                    this.pbest[i] = result[i];
                    pso.log(this.particleName + ": New local best: for " + i + ": " + pbest[i].result + "," + pbest[i].value,1);
                }
                // update global best
                if(pso.gbest[i].result < result[i].result) {
                    pso.gbest[i] = result[i];
                    pso.log(this.particleName + ": New global best: for " + i + ": " + pso.gbest[i].result + "," + pso.gbest[i].value,1);
                }
            }
        }
    };
    this.scoringFunction = scoringFunction;
};

/**
 * Constructor for Particle object
 *
 * @param scoringVector scoring vector
 * @param scoringFn  function to use in evaluating performance
 * @param inertia
 * @param localAcceleration
 * @param node  DOM Node used to physically represent this particle
 * @constructor
 */
pso.Particle = function( scoringVector, scoringFn, inertia, localAcceleration, node ) {
    this.pbest = scoringVector;
    this.name = "P" + ++pso.globalParticleCounter;
    this.scoreCard = new pso.ScoreCard(scoringFn, this.pbest, this.name);
    this.inertia = inertia;
    this.localAcceleration = localAcceleration;
    this.node = node;

    // use scoring vector to create the values vector
    // initialize position/velocity vector
    this.vector = {
        pos: {},
        velocity: {}
    };
    for(var i  in scoringVector) {
        if(scoringVector.hasOwnProperty(i)) {
            this.vector.pos[i] =  Math.random()*500;
            this.vector.velocity[i] = Math.random();
        }
    }

    this.getNextVelocityVector = function(pos, velocity) {

        var r1 =  Math.random();
        var r2 = Math.random();

        for(var i in velocity) {
            if(velocity.hasOwnProperty(i))  {
                velocity[i] = velocity[i]*this.inertia +
                    this.localAcceleration * r1 * (this.pbest[i].value  - pos[i]) * pso.timeIncrement +
                    pso.globalAcceleration * r2 * (pso.gbest[i].value - pos[i]) * pso.timeIncrement;
                pso.log(this.name + ": New velocity value for " + i + ": " + velocity[i],0);
            }
        }
        return velocity;
    };

    this.getNextPositionVector = function(pos, velocity) {
        for(var i in pos) {
            if(pos.hasOwnProperty(i)) {
                pos[i] +=  velocity[i] * pso.timeIncrement;
                pso.log(this.name+ ": New position value for " + i + ": " + pos[i],0);
            }
        }
        return pos;
    };

    this.moveParticle = function() {

        // first time around the position and velocity used are random, after each iteration, their previous state is used
        this.vector.velocity =   this.getNextVelocityVector(this.vector.pos, this.vector.velocity);
        this.vector.pos = this.getNextPositionVector(this.vector.pos, this.vector.velocity);

        // update scorecard with current results
        this.scoreCard.addScore(this.vector.pos);

        //update node's position
        pso.setPosition(this.node, this.vector.pos.x, this.vector.pos.y);

        // slowly start favoring social interaction over cognitive
        this.localAcceleration-=0.0003;
        pso.globalAcceleration-=0.0001;
    };

};

/**********************************   Test Setup      ****************************************************************
    vector will be 3-d space represented by x,y and z
    scoring function will evaluate based on distance from target location = predefined spot of {x: 300, y:100, z: -10 }
**********************************************************************************************************************/

/**
 * Sample implementation of a success evaluation function
 *
 * @param vector   position vector, in this case for 3 dimensions
 * @return {Object} scoring vector (position vector + scores for each dimension)
 */
pso.successFn  = function(vector) {
    var dx = Math.sqrt(Math.pow(vector.x - pso.targetX, 2));
    var dy = Math.sqrt(Math.pow(vector.y - pso.targetY, 2));
    var dz = Math.sqrt(Math.pow(vector.z - pso.targetZ, 2));

    return {
        x: {result: dx == 0? Infinity : 1/dx, value: vector.x},
        y: {result: dy == 0? Infinity : 1/dy, value: vector.y},
        z: {result: dz == 0? Infinity : 1/dz, value: vector.z}
    };

};

/**
 * Determine if we are optimized enough to quit trying any further
 *
 * @param best current best value vector
 * @return {Boolean}
 */
pso.isGoodEnough = function(best) {
    var delta = Math.abs(best.x.value-pso.targetX) + Math.abs(best.y.value- pso.targetY) + Math.abs(best.z.value - pso.targetZ);
    return delta < 0.5;
};

/**
 * DOM Node factory function used to create particle representation as a DOM node in a web page
 *
 * @param id - id of the node
 * @return {Element}
 */
pso.createParticleNode = function (id) {
    var node = document.createElement("img");
    node.setAttribute("id", id);
    //node.setAttribute("src","http://tuescher.de/bilder/insektenschutz/insektenwissen/w_ameise.jpg");
    //node.setAttribute("src","http://www.freestockphotos.biz/pictures/11/11277/ant.png");
    node.setAttribute("src","images/ant.gif");
    node.setAttribute("width", "52px");
    node.setAttribute("height", "42px");
    pso.setPosition(node, Math.random()* 1024, Math.random()*768);
    var angle = Math.floor(Math.random()*360) + "deg";
    node.setAttribute("transform", "rotate(" + angle + ")");
    //node.setAttribute("-ms-transform", "rotate(" + angle + ")");
    //node.setAttribute("-webkit-transform", "rotate(" + angle + ")");
    document.body.appendChild(node);
    return node;
};

/**
 *  moves the particle around in 2-dimensional space on a page
 *
 * @param node - particle node to move
 * @param x
 * @param y
 */
pso.setPosition = function(node, x,y) {
    node.setAttribute("style", "z-index:2;position: absolute; top:" + y + "px;left: " + x + "px;");
};

// set up target(goal) DOM Node
(function(){
    var goalNode = document.createElement("img");
    goalNode.setAttribute("src", "images/honey.png");
    goalNode.setAttribute("width", "200px");
    goalNode.setAttribute("height", "200px");
    pso.setPosition(goalNode, pso.targetX-100, pso.targetY-100);
    document.body.appendChild(goalNode);
    pso.goalNode = goalNode;
})();

/**
 * Function to move goal node, thereby changing the goal parameters
 *
 * @param e DOM Event Object
 */
pso.moveGoalNode = function(e){
    var id = e.keyIdentifier || e.keyCode;
    switch(id) {
        case 'Down':
        case 40:
            pso.targetY+=5;
            pso.globalAcceleration+=0.001;
            break;
        case 'Up':
        case 38:
            pso.targetY-=5;
            pso.globalAcceleration+=0.001;
            break;
        case 'Left':
        case 37:
            pso.targetX-=5;
            pso.globalAcceleration+=0.001;
            break;
        case 'Right':
        case 39:
            pso.targetX+=5;
            pso.globalAcceleration+=0.001;
            break;
        default:
            break;
    }
    pso.setPosition(pso.goalNode, pso.targetX-50, pso.targetY-50);
};

/**
 *  function that triggers test runs; gets called on document load
 */
pso.startSimulation = function() {
    // staggered timeout values
    var t1=611;
    var t2=923;
    var t3=301;

    // number of particles to generate
    var numParticles = 20;

    for(var i=1; i<=numParticles ; i++) {
        pso.particles.push(new pso.Particle(new pso.Vector(), pso.successFn, pso.defaultInertia, pso.defaultLocalAcceleration, pso.createParticleNode("p" + i)));
        var intervalId= setInterval(function() {
            var p = pso.particles.pop();
            p.moveParticle();
            pso.totalRuns++;

            setTimeout(function(){
                pso.particles.push(p);
            },t1);

        }, t2+i);
        pso.intervals.push(intervalId);
    }

    // set up guard condition to terminate test
    var checkInt = setInterval(function(){
        if(pso.totalRuns> pso.maxRuns || pso.isGoodEnough(pso.gbest)) {
            for(var i=0; i<20; i++) {
                clearInterval(pso.intervals[i]);
            }
            clearInterval(checkInt);
            pso.log("Terminating after " + pso.totalRuns + " runs. Gbest values are: x-" + pso.gbest.x.value + ", y-" + pso.gbest.y.value ,4);
            pso.totalRuns = 0;
        }
    }, t3);
};



