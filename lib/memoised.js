// Copyright (c) 2013-2014 Quildreen Motta <quildreen@gmail.com>
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

/**
 * @module lib/memoised
 */

/**
 * A function that memoises the result of a future operation, for performance
 * of pure futures.
 *
 * @method
 * @summary ((α → Void), (β → Void) → Void), Future[α, β] → ((α → Void), (β → Void) → Void)
 */
exports.memoisedFork = memoisedFork
function memoisedFork(f, future) {
  var pending  = []
  var started  = false
  var resolved = false
  var rejected = false
  var value    = null

  return fold

  // The fold applies the correct operation to the future's value, if the
  // future has been resolved. Or we run the operation instead.
  //
  // For optimisation purposes, we cache the result of the operation, so
  // if we started an operation before, we mark it as started and push
  // any subsequent forks into a pending queue that will be invoked once
  // the original fork returns.
  function fold(g, h) {
    return resolved?        h(value)
    :      rejected?        g(value)
    :      started?         addToPendingOperations(g, h)
    :      /* otherwise */  resolveFuture(g, h)
  }

  // Remembers some operation to fire at a later point in time, when the
  // future gets resolved
  function addToPendingOperations(g, h) {
    pending.push({ rejected: g, resolved: h })
  }

  // Resolves the future, and memorises its value and resolution strategy
  function resolveFuture(g, h) {
    started = true
    return f( function(a) { rejected     = true
                            value = a
                            invokePending('rejected', a)
                            return g(a) }

            , function(b) { resolved     = true
                            value = b
                            invokePending('resolved', b)
                            return h(b) })
  }

  // Invokes operations that were added before the future got a value
  function invokePending(kind, value) {
    var xs = pending
    started        = false
    pending.length = 0

    for (var i = 0; i < xs.length; ++i)  xs[i][kind](value)
  }
}
