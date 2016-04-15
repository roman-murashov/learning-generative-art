(function (window, document) {

window.learningUniforms = generateUniforms();

var deepqlearn = require("deepqlearn");
var num_inputs = 1; // 9 eyes, each sees 3 numbers (wall, green, red thing proximity)
var num_actions = getActions().length; // 5 possible angles agent can turn
var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:num_actions});

// options for the Temporal Difference learner that trains the above net
// by backpropping the temporal difference learning rule.
var tdtrainer_options = {learning_rate:0.001, momentum:0.0, batch_size:64, l2_decay:0.01};

var opt = {};
opt.temporal_window = temporal_window;
opt.experience_size = 30000;
opt.start_learn_threshold = 1000;
opt.gamma = 0.7;
opt.learning_steps_total = 200000;
opt.learning_steps_burnin = 3000;
opt.epsilon_min = 0.05;
opt.epsilon_test_time = 0.05;
opt.layer_defs = layer_defs;
opt.tdtrainer_options = tdtrainer_options;

var brain = new deepqlearn.Brain(num_inputs, num_actions, opt); // woohoo

function generateUniforms () {
  var limit = 10;
  var _uniforms = [];
  while ( limit-- ) {
    _uniforms.push( { name: 'learning'+limit, index: limit, val: Math.random() } );
  }
  console.log(_uniforms);
  return _uniforms;
}

function getActions () {
  return window.learningUniforms.reduce(function (result, current, index) {
    result.push( (function () {
      //Decrement a little
      this.val -= 0.00001;
      return this;
    }).bind(current) );

    result.push( (function () {
      //Increment a little
      this.val += 0.00001;
      return this;
    }).bind(current) );

    result.push( (function () {
      //Decrement a lot
      this.val -= 0.1;
      return this;
    }).bind(current) );

    result.push( (function () {
      //Increment a lot
      this.val += 0.1;
      return this;
    }).bind(current) );

    return result;
  }, [function () {
    //no action
    //noop
  }]);
}

function learnToPaint () {
  //requestAnimationFrame(learnToPaint);
    var action = brain.forward(window.learningUniforms.map(function (uni) {
      return uni.val;
    }));
    // action is a number in [0, num_actions) telling index of the action the agent chooses
    getActions()[action]();
    // here, apply the action on environment and observe some reward. Finally, communicate it:
    var r = brain.backward( window.rewards.merit-window.rewards.demerit ); // <-- learning magic happens here
    window.rewards.merit *= 0.9;
    window.rewards.demerit *= 0.9;
    console.log(window.rewards.merit - window.rewards.demerit);
}
//learnToPaint();

})(window, document);
