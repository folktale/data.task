# # monads.future
#
# The `Future(a, b)` monad represents values that depend on time. This
# allows one to model time-based effects explicitly, such that one can
# have full knowledge of when they're dealing with delayed computations,
# latency, or anything that can not be computed immediately.
#  
# A common use for this monad is to replace the usual
# Continuation-Passing Style form of programming, in order to be
# able to compose and sequence time-dependent effects using the generic
# and powerful monadic operations.

/** ^
 * Copyright (c) 2013 Quildreen Motta
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


# ## Function: memoised-fork
#
# A function that memoises the result of a future operation, and updates
# the future with the relevant information for the `Show` and `Eq`
# typeclass implementations.
#  
# + type: ((a) -> Unit), (b) -> Unit)), Future(a, b) -> ((a) -> Unit, (b) -> Unit)
memoised-fork = (f, future) ->
  pending  = []
  started  = false
  resolved = false
  rejected = false

  # The fold applies the correct operation to the future's value, if the
  # future has been resolved. Or we run the operation instead.
  #  
  # For optimisation purposes, we cache the result of the operation, so
  # if we started an operation before, we mark it as started and push
  # any subsequent forks into a pending queue that will be invoked once
  # the original fork returns.
  return fold = (g, h) ->
    | resolved  => h future.value
    | rejected  => g future.value
    | started   => do
                   pending.push rejected: g, resolved: h
                   void
    | otherwise => do
                   started = true
                   f do
                     * (a) -> do
                              future.is-pending  := false
                              future.is-rejected := rejected := true
                              future.value       := a
                              invoke-pending \rejected, a
                              g a
                     * (b) -> do
                              future.is-pending  := false
                              future.is-resolved := resolved := true
                              future.value       := b
                              invoke-pending \resolved, b
                              h b

  function invoke-pending(kind, value)
    xs              = pending
    started        := false
    pending.length := 0
    for x in xs => x[kind] value


# ## Function: id
#
# The identity function.
#  
# + type: a -> a
id = (a) -> a

# ## Excepction: RejectedFutureExtractionError
#
# Thrown when trying to extract the value of a rejected future.
class RejectedFutureExtractionError extends TypeError
  ->
    TypeError.call this, "Can't extract the value of a rejected future."



# ## Class: Future
#
# The `Future(a, b)` monad.
class Future
  # ### Section: Constructors ##########################################

  # #### Constructor
  #
  # Creates a new Future for a long-running computation `f`.
  #
  # + type: ((a -> Unit), (b -> Unit)) -> Promise(a, b)
  (f) -> @fork = memoised-fork f, this


  # ### Section: Predicates ############################################

  # #### Field: is-pending
  #
  # True if the Future hasn't been resolved yet.
  #  
  # + type: Boolean
  is-pending: true

  # #### Field: is-resolved
  #
  # True if the Future has been resolved successfully.
  #
  # + type: Boolean
  is-resolved: false

  # #### Field: is-failure
  #
  # True if the Future has been rejected — resolved with a failure.
  #
  # + type: Boolean
  is-rejected: false


  # ### Section: Applicative ###########################################

  # #### Function: of
  #
  # Constructs a new Future containing the single value `b`.
  #
  # `b` can be any value, including `null`, `undefined` or another
  # `Future(a, b)` monad.
  #
  # + type: b -> Future(a, b)
  @of = (b) -> new Future (reject, resolve) -> resolve b
  of: (b) -> Future.of b

  # #### Function: ap
  #
  # Applies the function inside the Future to an applicative.
  #
  # + type: (@Future(a, b -> c), f:Applicative) => f(b) -> f(c)
  ap: (b) -> @chain (f) -> b.map f


  # ### Section: Functor ###############################################

  # #### Function: map
  #
  # Transforms the successful value of the Future using a regular unary
  # function.
  #
  # + type: (@Future(a, b)) => (b -> c) -> Future(a, c)
  map: (f) -> @chain (a) -> Future.of (f a)


  # ### Section: Chain #################################################

  # #### Function: chain
  #
  # Transforms the successful value of the Future using a function to a
  # monad of the same type.
  #
  # + type: (@Future(a, b)) => (b -> Future(a, c)) -> Future(a, c)
  chain: (f) ->
    new Future (reject, resolve) ~> @fork do
                                          * (a) -> reject a
                                          * (b) -> (f b).fork reject, resolve


  # ### Section: Show ##################################################

  # #### Function: to-string
  #
  # Returns a textual representation of the Future monad.
  #  
  # + type: (@Future(a, b)) => Unit -> String
  to-string: ->
    | @is-pending  => "Future.Pending"
    | @is-resolved => "Future.Resolved(#{@value})"
    | @is-rejected => "Future.Rejected(#{@value})"


  # ### Section: Eq ####################################################

  # #### Function: is-equal
  #
  # Tests if an Future monad is equal to another Future monad.
  #  
  # Equality with pending futures is only decidable if the computation
  # of both futures can be resolved synchronously. Otherwise this
  # function will return false.
  #
  # + type: (@Future(a, b)) => Future(a, b) -> Boolean
  is-equal: (a) -> Boolean switch
    | @is-resolved => a.is-resolved and (a.value is @value)
    | @is-rejected => a.is-rejected and (a.value is @value)
    | @is-pending  => @fork do
                            * (e) -> a.fork do
                                            * (e2) -> e is e2
                                            * (_)  -> false
                            * (s) -> a.fork do
                                            * (_)  -> false
                                            * (s2) -> s is s2


  # ### Section: Extracting and Recovering #############################

  # #### Function: get
  #
  # Extracts the successful value out of the Future monad, if it
  # exists. Otherwise throws a `TypeError`.
  #  
  # + see: get-or-else — A getter that can handle failures.
  # + see: merge — Returns the convergence of both values.
  # + type: (@Future(a, b), *throws) => Unit -> b
  # + throws: TypeError — if the monad doesn't have a successful value.
  get: ->
    | @is-resolved => @value
    | @is-rejected => throw new RejectedFutureExtractionError
    | @is-pending  => @fork do
                            * (a) -> throw new RejectedFutureExtractionError
                            * id

  # #### Function: get-or-else
  #
  # Extracts the successful value out of the Future monad. If the monad
  # doesn't have a successful value, returns the given default.
  #
  # + type: (@Future(a, b)) => b -> b
  get-or-else: (b) ->
    | @is-resolved => @value
    | @is-rejected => b
    | @is-pending  => @fork do
                            * (a) -> b
                            * id

  # #### Function: or-else
  #
  # Transforms a failure value into a new Future monad. Does nothing if
  # the monad contains a successful value.
  #
  # + type: (@Future(a, b)) => (a -> Future(c, b)) -> Future(c, b)
  or-else: (f) ->
    new Future (reject, resolve) ~> @fork do
                                          * (a) -> (f a).fork reject, resolve
                                          * (b) -> resolve b

  # #### Function: merge
  #
  # Returns the value of whichever side of the disjunction that is
  # present.
  #
  # + type: (@Future(a, a)) => Unit -> a
  merge: ->
    | @is-pending => @fork id, id
    | otherwise   => @value

  # ### Section: Folds and Extended Transformations ####################

  # #### Function: fold
  #
  # Catamorphism. Takes two functions, applies the leftmost one to the
  # failure value and the rightmost one to the successful value,
  # depending on which one is present.
  #
  # + type: (@Future(a, b)) => (a -> c) -> (b -> c) -> Future(d, c)
  fold: (f, g) --> new Future (reject, resolve) ~> @fork do
                                                         * (a) -> resolve (f a)
                                                         * (b) -> resolve (g b)


  # #### Function: swap
  #
  # Swaps the disjunction values.
  #  
  # + type: (@Future(a, b)) => Unit -> Future(b, a)
  swap: -> new Future (reject, resolve) ~> @fork do
                                                 * (a) -> resolve a
                                                 * (b) -> reject b

  # #### Function: bimap
  #
  # Maps both sides of the disjunction.
  #
  # + type: (@Future(a, b)) => (a -> c) -> (b -> d) -> Future(c, d)
  bimap: (f, g) --> new Future (reject, resolve) ~> @fork do
                                                          * (a) -> reject (f a)
                                                          * (b) -> resolve (g b)

  # #### Function: rejected-map
  #
  # Maps the left side of the disjunction (failure).
  #  
  # + type: (@Future(a, b)) => (a -> c) -> Future(c, b)
  rejected-map: (f) -> new Future (reject, resolve) ~> @fork do
                                                             * (a) -> reject (f a)
                                                             * (b) -> resolve b


# ## Exports
module.exports = Future
