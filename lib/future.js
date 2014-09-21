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
 * @module lib/future
 */
module.exports = Future


// -- Dependencies -----------------------------------------------------
var memoisedFork = require('./memoised').memoisedFork


// -- Implementation ---------------------------------------------------

/**
 * The `Future[α, β]` structure represents values that depend on time. This
 * allows one to model time-based effects explicitly, such that one can have
 * full knowledge of when they're dealing with delayed computations, latency,
 * or anything that can not be computed immediately.
 *
 * A common use for this structure is to replace the usual Continuation-Passing
 * Style form of programming, in order to be able to compose and sequence
 * time-dependent effects using the generic and powerful monadic operations.
 *
 * @class
 * @summary
 * ((α → Void), (β → Void) → Void) → Future[α, β]
 *
 * Future[α, β] <: Chain[β]
 *               , Monad[β]
 *               , Functor[β]
 *               , Applicative[β]
 *               , Semigroup[β]
 *               , Monoid[β]
 *               , Show
 */
function Future(f) {
  this.fork = f
}

/**
 * Creates a `Future[α, β]` that computes the action at most once.
 *
 * Since this function will remember the resolved value of the future, **it's
 * expected to be used only for pure actions,** otherwise you may not be able
 * to observe the effects.
 *
 * @summary ((α → Void), (β → Void) → Void) → Future[α, β]
 */
Future.prototype.memoise = function _memoise(f) {
  if (typeof console !== 'undefined')
    console.warn("Future#memoise is deprecated. Use control.async's memoise() function instead.")

  var future  = new Future()
  future.fork = memoisedFork(f, future)
  return future
}
Future.memoise = Future.prototype.memoise


/**
 * Constructs a new `Future[α, β]` containing the single value `β`.
 *
 * `β` can be any value, including `null`, `undefined`, or another
 * `Future[α, β]` structure.
 *
 * @summary β → Future[α, β]
 */
Future.prototype.of = function _of(b) {
  return new Future(function(_, resolve){ return resolve(b) })
}
Future.of = Future.prototype.of


// -- Functor ----------------------------------------------------------

/**
 * Transforms the successful value of the `Future[α, β]` using a regular unary
 * function.
 *
 * @summary @Future[α, β] => (β → γ) → Future[α, γ]
 */
Future.prototype.map = function _map(f) {
  return this.chain(function(a){ return Future.of(f(a)) })
}


// -- Chain ------------------------------------------------------------

/**
 * Transforms the succesful value of the `Future[α, β]` using a function to a
 * monad.
 *
 * @summary @Future[α, β] => (β → Future[α, γ]) → Future[α, γ]
 */
Future.prototype.chain = function _chain(f) {
  return new Future(function(reject, resolve) {
                      return this.fork( function(a){
                                          return reject(a) }
                                      , function(b){
                                          return f(b).fork(reject, resolve) })
                    }.bind(this))
}


// -- Apply ------------------------------------------------------------

/**
 * Applys the successful value of the `Future[α, (β → γ)]` to the successful
 * value of the `Future[α, β]`
 *
 * @summary @Future[α, (β → γ)] => Future[α, β] → Future[α, γ]
 */

Future.prototype.ap = function _ap(f2) {
  return this.chain(function(f) { return f2.map(f) })
}


// -- Semigroup ------------------------------------------------------------

/**
 * Selects the earlier of the two futures `Future[α, β]`
 *
 * @summary @Future[α, β] => Future[α, β] → Future[α, β]
 */

Future.prototype.concat = function _concat(f2) {
  var done = false;

  return new Future(function(reject, resolve) {
    return this.fork(runIfNotDone(reject), runIfNotDone(resolve))
        || f2.fork(runIfNotDone(reject), runIfNotDone(resolve))
  }.bind(this))

  function runIfNotDone(f){ return function(x) {
    if (!done) {
      done = true
      return f(x) }}}
}


// -- Monoid ------------------------------------------------------------

/**
 * Returns a Future that will never resolve
 *
 * @summary Void → Future[α, _]
 */
Future.empty = function _empty() {
  return new Future(function(rej, res){ /* never resolve */ })
}

Future.prototype.empty = Future.empty


// -- Show -------------------------------------------------------------

/**
 * Returns a textual representation of the `Future[α, β]`
 *
 * @summary @Future[α, β] => Void → String
 */
Future.prototype.toString = function _toString() {
  return 'Future'
}


// -- Extracting and recovering ----------------------------------------

/**
 * Transforms a failure value into a new `Future[α, β]`. Does nothing if the
 * structure already contains a successful value.
 *
 * @summary @Future[α, β] => (α → Future[γ, β]) → Future[γ, β]
 */
Future.prototype.orElse = function _orElse(f) {
  return new Future(function(reject, resolve) {
                      return this.fork( function(a){
                                          return f(a).fork(reject, resolve) }
                                      , function(b){
                                          return resolve(b) })
                    }.bind(this))
}


// -- Folds and extended transformations -------------------------------

/**
 * Catamorphism. Takes two functions, applies the leftmost one to the failure
 * value, and the rightmost one to the successful value, depending on which one
 * is present.
 *
 * @summary @Future[α, β] => (α → γ), (β → γ) → Future[δ, γ]
 */
Future.prototype.fold = function _fold(f, g) {
  return new Future(function(reject, resolve) {
                      return this.fork( function(a){
                                          return resolve(f(a)) }
                                      , function(b){
                                          return resolve(g(b)) })
                    }.bind(this))
}

/**
 * Swaps the disjunction values.
 *
 * @summary @Future[α, β] => Void → Future[β, α]
 */
Future.prototype.swap = function _swap() {
  return new Future(function(reject, resolve) {
                      return this.fork( function(a){
                                          return resolve(a) }
                                      , function(b){
                                          return reject(b) })
                    }.bind(this))
}

/**
 * Maps both sides of the disjunction.
 *
 * @summary @Future[α, β] => (α → γ), (β → δ) → Future[γ, δ]
 */
Future.prototype.bimap = function _bimap(f, g) {
  return new Future(function(reject, resolve) {
                      return this.fork( function(a){
                                          return reject(f(a)) }
                                      , function(b){
                                          return resolve(g(b)) })
                    }.bind(this))
}

/**
 * Maps the left side of the disjunction (failure).
 *
 * @summary @Future[α, β] => (α → γ) → Future[γ, β]
 */
Future.prototype.rejectedMap = function _rejectedMap(f) {
  return new Future(function(reject, resolve) {
                      return this.fork( function(a){
                                          return reject(f(a)) }
                                      , function(b){
                                          return resolve(b) })
                    }.bind(this))
}
