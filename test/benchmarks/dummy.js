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

function task(delay, v, done) {
  setTimeout(function(){ done(null, v) }, delay)
}

exports.lightTask = lightTask;
function lightTask(v){ return function(done) {
  setImmediate(function(){ done(null, v) })
}}

exports.heavyTask = heavyTask;
function heavyTask(v){ return function(done) {
  return task(50, v, done)
}}

exports.syncTask = syncTask;
function syncTask(v){ return function(done) {
  return done(null, v)
}}

exports.fail = fail;
function fail(done) {
  return done(new Error('intentional failure'))
}

exports.range = range;
function range(start, end) {
  var xs = [];
  for (var i = start; i < end; ++i)  xs.push(i);
  return xs;
}

exports.randomByte = randomByte;
function randomByte() {
  return (Math.random() * 255) | 0
}

exports.randomDistribution = randomDistribution;
function randomDistribution() {
  return 0.5 - Math.random()
}