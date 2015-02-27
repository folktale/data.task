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

var Bluebird = require('bluebird');
var Future = require('data.future');

exports.sum = sum;
function sum(xs) {
  return xs.reduce(function(a, b){ return a + b }, 0);
}

exports.runSum = runSum;
function runSum(f, xs, result) {
  return new Future(function(reject, resolve) {
    f(xs, function(error, data) {
      if (error) {
        reject(error);
      }
      else if (sum(data) !== result) {
        reject(new Error('Invalid result: ' + sum(data) + ', expected: ' + result));
      } else {
        resolve(data);
      }
    });
  })
}

exports.toFuture = toFuture;
function toFuture(F){ return function(f) {
  return new F(function(reject, resolve) {
    f(function(error, data) {
      if (error)  reject(error)
      else        resolve(data)
    })
  })
}}

exports.toBluebird = Bluebird.promisify;
