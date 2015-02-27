/** ^
 * Copyright (c) 2013-2014 Quildreen Motta
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

Task = require '../lib/'

# #### Function: is-equal
#
# Tests if an Task monad is equal to another Task monad.
#
# Equality with pending tasks is only decidable if the computation
# of both tasks can be resolved synchronously. Otherwise this
# function will return false.
#
# **WARNING:** this is a partial function, it'll only work for
# tasks representing synchronous actions.
#
# + type: (@Task(a, b)) => Task(a, b) -> Boolean
Task::is-equal = (a) -> @fork do
                                 * (e) -> a.fork do
                                                 * (e2) -> e === e2
                                                 * (_)  -> false
                                 * (s) -> a.fork do
                                                 * (_)  -> false
                                                 * (s2) -> s === s2

module.exports = Task
