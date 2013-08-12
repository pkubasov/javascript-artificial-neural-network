/**
 * Particle swarm optimization
 *
 * Author: Philip Kubasov
 * Date: 7/31/13
 * Time: 9:44 AM
 *
 */

// namespace
var pso = {};

/**
 *  # of particles created (during test run or prod run)
 * @type {Number}
 */
pso.globalParticleCounter=0;

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
 * delta t, how long a particle is considered to run with current velocity
 * @type {Number}
 */
pso.timeIncrement = 1;

/**
 * total number of runs counter
 * @type {Number}
 */
pso.totalRuns = 0;

/**
 * position vector constructor
 * @constructor
 */
pso.Vector = function() {
    // sample scoring vector for 3-d motion, could be n-dimensional
    /*
    this.x = {
        result: 0, value : 0, runsMissingGoal:0
    };
    this.y = {
        result: 0, value : 0, runsMissingGoal:0
    };
    this.z = {
        result: 0, value : 0, runsMissingGoal:0
    };
    */
    throw new Error("Required implementation of Vector constructor function is missing");

};
// pso.gbest = new Vector() ; // should follow implementation of Vector

LOG_LEVEL = 2;
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

    this.pbest = pbest;

    this.addScore = function (val) {
        //timeSlot.push(val);
        pso.log("Current local best for " + this.particleName + " is x:" + this.pbest.x.value + ",y:" + this.pbest.y.value + ",z:" + this.pbest.z.value ,0);
        var result = this.scoringFunction(val);
        for(var i in result) {
            if(result.hasOwnProperty(i))  {
                this.pbest[i].runsMissingGoal++;
                // update local best
                if(this.pbest[i].result < result[i].result) {
                    this.pbest[i] = result[i];
                    this.pbest[i].runsMissingGoal = 0;
                    pso.log(this.particleName + ": New local best: for " + i + ". Score: " + pbest[i].result + ",Value: " + pbest[i].value,1);
                }
                // update global best
                if(pso.gbest[i].result < result[i].result) {
                    pso.gbest[i] = result[i];
                    this.pbest[i].runsMissingGoal = 0;
                    pso.log(this.particleName + ": New global best: for " + i + ". Score: " + pso.gbest[i].result + ", Value:" + pso.gbest[i].value,1);
                    pso.broadcastResults(i, pso.gbest[i].value);
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
    this.isRunning = false;
    this.unsuccessfulRunThreshold = 15;

    // use scoring vector to create the values vector
    // initialize position/velocity vector
    this.vector = {
        pos: {},
        velocity: {}
    };
    for(var i  in scoringVector) {
        if(scoringVector.hasOwnProperty(i)) {
            this.vector.pos[i] =  Math.random()*screen.availWidth; //close enough to distribute evenly
            this.vector.velocity[i] = Math.random();
        }
    }

    this.getNextVelocityVector = function(pos, velocity) {

        for(var i in velocity) {
            var r1 =  Math.random();
            var r2 = Math.random();

            if(velocity.hasOwnProperty(i))  {
                if(this.pbest[i].runsMissingGoal > this.unsuccessfulRunThreshold) {
                   this.pbest[i].result = 0;
                   this.localAcceleration = pso.defaultLocalAcceleration;
                   pso.globalAcceleration+=0.00005;
                   pso.log(this.name + ": trying to improve result by re-starting optimization for " + i + " dimension", 1);
                }
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
        pso.setPosition(this.node, this.vector.pos);

        // slowly start favoring social interaction over cognitive
        this.localAcceleration-=0.0003;
        pso.globalAcceleration-=0.0001;
    };

    this.start = function(maxRuns) {
        // staggered timeout values
        var t1=611;
        var t2=623;
        var that = this;

        var runInt = setInterval(function(){
            that.moveParticle();
            that.isRunning = true;
            pso.totalRuns++;
        },t2);

        var checkInt = setInterval(function(){
              if(pso.isGoodEnough(that.pbest) || pso.totalRuns > maxRuns) {
                  clearInterval(runInt);
                  clearInterval(checkInt);
                  that.isRunning = false;
              }
        },t1);

    };
};

/**
 * Determine if we are optimized enough to quit trying any further
 * This should be overridden as needed
 *
 * @param best current best value vector
 * @return {Boolean}
 */
pso.isGoodEnough = function(best) {
    throw new Error("Required implementation of isGoodEnough function is missing");
    return false;
};

/**
 * DOM Node factory function used to create particle representation as a DOM node in a web page
 *
 * @param id - id of the node
 * @return {Element}
 */
pso.createParticleNode = function (id) {
   throw new Error("Required implementation of createParticleNode function is missing");
   return null;
};

/**
 * moves the particle around in n-dimensional space
 *
 * @param node - particle node to move
 * @param pos -  position vector
 *
 */
pso.setPosition = function(node, pos) {
    throw new Error("Required implementation of setPosition function is missing");
};

/**
 *  Optional function to be overridden for publishing results
 * @param dim
 * @param value
 */
pso.broadcastResults = function(dim, value) {

}





