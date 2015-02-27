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

'use strict';

/**
 * @module lib/task
 */
module.exports = Task;

// -- Implementation ---------------------------------------------------

/**
 * The `Task[α, β]` structure represents values that depend on time. This
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
 * ((α → Void), (β → Void) → Void), (Void → Void) → Task[α, β]
 *
 * Task[α, β] <: Chain[β]
 *               , Monad[β]
 *               , Functor[β]
 *               , Applicative[β]
 *               , Semigroup[β]
 *               , Monoid[β]
 *               , Show
 */
function Task(computation, cleanup) {
	this.fork = computation;
	
	this.cleanup = cleanup || function() {};
}

/**
 * Constructs a new `Task[α, β]` containing the single value `β`.
 *
 * `β` can be any value, including `null`, `undefined`, or another
 * `Task[α, β]` structure.
 *
 * @summary β → Task[α, β]
 */
Task.prototype.of = function _of(b) {
	return new Task(function(_, resolve) {
		return resolve(b);
	});
};

Task.of = Task.prototype.of;

/**
 * Constructs a new `Task[α, β]` containing the single value `α`.
 *
 * `α` can be any value, including `null`, `undefined`, or another
 * `Task[α, β]` structure.
 *
 * @summary α → Task[α, β]
 */
Task.prototype.rejected = function _rejected(a) {
	return new Task(function(reject) {
		return reject(a);
	});
};

Task.rejected = Task.prototype.rejected;

// -- Functor ----------------------------------------------------------

/**
 * Transforms the successful value of the `Task[α, β]` using a regular unary
 * function.
 *
 * @summary @Task[α, β] => (β → γ) → Task[α, γ]
 */
Task.prototype.map = function _map(f) {
	var fork = this.fork;
	var cleanup = this.cleanup;
	
	return new Task(function(reject, resolve) {
		return fork(function(a) {
			return reject(a);
		}, function(b) {
			return resolve(f(b));
		});
	}, cleanup);
};

// -- Chain ------------------------------------------------------------

/**
 * Transforms the succesful value of the `Task[α, β]` using a function to a
 * monad.
 *
 * @summary @Task[α, β] => (β → Task[α, γ]) → Task[α, γ]
 */
Task.prototype.chain = function _chain(f) {
	var fork = this.fork;
	var cleanup = this.cleanup;
	
	return new Task(function(reject, resolve) {
		return fork(function(a) {
			return reject(a);
		}, function(b) {
			return f(b).fork(reject, resolve);
		});
	}, cleanup);
};

// -- Apply ------------------------------------------------------------

/**
 * Applys the successful value of the `Task[α, (β → γ)]` to the successful
 * value of the `Task[α, β]`
 *
 * @summary @Task[α, (β → γ)] => Task[α, β] → Task[α, γ]
 */

Task.prototype.ap = function _ap(f2) {
	return this.chain(function(f) {
		return f2.map(f);
	});
};

// -- Semigroup ------------------------------------------------------------

/**
 * Selects the earlier of the two tasks `Task[α, β]`
 *
 * @summary @Task[α, β] => Task[α, β] → Task[α, β]
 */

Task.prototype.concat = function _concat(that) {
	var forkThis = this.fork;
	var forkThat = that.fork;
	var cleanupThis = this.cleanup;
	var cleanupThat = that.cleanup;
	var cleanupBoth;
	
	if (cleanupThis != null && cleanupThat != null) {
		cleanupBoth = function() {
			cleanupThis();
			cleanupThat();
		};
	} else {
		cleanupBoth = cleanupThis || cleanupThat;
	}
	
	var done = false;
	
	return new Task(function(reject, resolve) {
		var thisResult = forkThis(guard(reject, cleanupThat),
			guard(resolve, cleanupThat));
		
		var thatResult = forkThat(guard(reject, cleanupThis),
			guard(resolve, cleanupThis));
		
		return thisResult || thatResult;
	}, cleanupBoth);
	
	function guard(f, cleanup) {
		return function(x) {
			if (!done) {
				done = true;
				
				if (cleanup != null) {
					cleanup();
				}
				
				return f(x);
			}
		};
	}
};

// -- Monoid ------------------------------------------------------------

/**
 * Returns a Task that will never resolve
 *
 * @summary Void → Task[α, _]
 */
Task.empty = function _empty() {
	return new Task(function() {});
};

Task.prototype.empty = Task.empty;

// -- Show -------------------------------------------------------------

/**
 * Returns a textual representation of the `Task[α, β]`
 *
 * @summary @Task[α, β] => Void → String
 */
Task.prototype.toString = function _toString() {
	return 'Task';
};

// -- Extracting and recovering ----------------------------------------

/**
 * Transforms a failure value into a new `Task[α, β]`. Does nothing if the
 * structure already contains a successful value.
 *
 * @summary @Task[α, β] => (α → Task[γ, β]) → Task[γ, β]
 */
Task.prototype.orElse = function _orElse(f) {
	var fork = this.fork;
	var cleanup = this.cleanup;
	
	return new Task(function(reject, resolve) {
		return fork(function(a) {
			return f(a).fork(reject, resolve);
		}, function(b) {
			return resolve(b);
		});
	}, cleanup);
};

// -- Folds and extended transformations -------------------------------

/**
 * Catamorphism. Takes two functions, applies the leftmost one to the failure
 * value, and the rightmost one to the successful value, depending on which one
 * is present.
 *
 * @summary @Task[α, β] => (α → γ), (β → γ) → Task[δ, γ]
 */
Task.prototype.fold = function _fold(f, g) {
	var fork = this.fork;
	var cleanup = this.cleanup;
	
	return new Task(function(reject, resolve) {
		return fork(function(a) {
			return resolve(f(a));
		}, function(b) {
			return resolve(g(b));
		});
	}, cleanup);
};

/**
 * Catamorphism.
 *
 * @summary @Task[α, β] => { Rejected: α → γ, Resolved: β → γ } → Task[δ, γ]
 */
Task.prototype.cata = function _cata(pattern) {
	return this.fold(pattern.Rejected, pattern.Resolved);
};

/**
 * Swaps the disjunction values.
 *
 * @summary @Task[α, β] => Void → Task[β, α]
 */
Task.prototype.swap = function _swap() {
	var fork = this.fork;
	var cleanup = this.cleanup;
	
	return new Task(function(reject, resolve) {
		return fork(function(a) {
			return resolve(a);
		}, function(b) {
			return reject(b);
		});
	}, cleanup);
};

/**
 * Maps both sides of the disjunction.
 *
 * @summary @Task[α, β] => (α → γ), (β → δ) → Task[γ, δ]
 */
Task.prototype.bimap = function _bimap(f, g) {
	var fork = this.fork;
	var cleanup = this.cleanup;
	
	return new Task(function(reject, resolve) {
		return fork(function(a) {
			return reject(f(a));
		}, function(b) {
			return resolve(g(b));
		});
	}, cleanup);
};

/**
 * Maps the left side of the disjunction (failure).
 *
 * @summary @Task[α, β] => (α → γ) → Task[γ, β]
 */
Task.prototype.rejectedMap = function _rejectedMap(f) {
	var fork = this.fork;
	var cleanup = this.cleanup;
	
	return new Task(function(reject, resolve) {
		return fork(function(a) {
			return reject(f(a));
		}, function(b) {
			return resolve(b);
		});
	}, cleanup);
};
 
