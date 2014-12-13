// Copyright (c) 2014 Quildreen Motta <quildreen@gmail.com>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Parallel tasks
// ==============
//
// This scenario involves doing tasks where there are no dependencies
// between them, therefore they may be ran concurrently. This is the
// best case scenario for concurrency. It again tests how much overhead
// is introduced by each approach to handling concurrency.
//
// The scenario:
//
// * An implementation receives a list of tasks;
// * All tasks are of type `(Error, String → Void)`;
// * Tasks may be ran concurently, and their results must be collected in an array;
// * If one task pass an `Error` value, the entire operation fails;
// * The implementation should pass the collected array to the node-style callback;

var benchmark = require('test.benchmark');
var dummy = require('../../dummy');
var _ = require('../../utils');
var Future = require('data.future');


// -- Implementations
var impl = {
  baseline: require('./callback-baseline'),
  async: require('./callback-async'),
  futures: require('./future')(Future),
  bluebird: require('./bluebird')
}


// -- Benchmarks

// In a scenario where all tasks can be ran concurrently, an efficient
// implementation will be able to complete all tasks slightly after the
// most time consuming task completes.
function allConcurrent() {
  var light = dummy.range(0, 10).map(dummy.randomByte);
  var heavy = dummy.range(0, 5).map(dummy.randomByte);
  var result = _.sum(light.concat(heavy));
  var tasks = light.map(dummy.lightTask).concat(heavy.map(dummy.heavyTask));

  return {
    'Callbacks (baseline)':
      _.runSum(impl.baseline, tasks, result),
    'Callbacks (async)':
      _.runSum(impl.async, tasks, result),
    'Tasks (Data.Future)':
      _.runSum(impl.futures, tasks.map(_.toFuture(Future)), result),
    'Promises/A+ (Bluebird)':
      _.runSum(impl.bluebird, tasks.map(_.toBluebird), result)
  }
}


module.exports = [
  benchmark.asyncSuite('Parallel', allConcurrent())
]
