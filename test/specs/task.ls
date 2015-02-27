# # Specification for Task

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

spec = (require 'hifive')!
Task = require '../eq-task'
{for-all, data: {Any:BigAny, Int}, sized, choice, transform} = require 'claire'
{ok, throws, equal} = require 'assert'

Any  = sized (-> 10), BigAny
AnyF = choice Any, (transform (-> Task.of it), AnyF)

k        = (a, b) --> a
id       = (a) -> a
rejected = Task.rejected

module.exports = spec 'Task' (o, spec) ->

  o 'rejected(a) should create a rejected task.' do
     for-all(Any).satisfy (a) ->
       (rejected a).is-equal (new Task (f, _) -> f a)
     .as-test!

  o 'map(f) should do nothing for rejected tasks.' do
     for-all(AnyF, AnyF).satisfy (a, b) ->
       (rejected a).map(-> b).is-equal (rejected a)
     .as-test!

  o 'ap(u) should do nothing for rejected tasks.' do
     for-all(AnyF, AnyF).satisfy (a, b) ->
       Task.of(-> b).ap(rejected a).is-equal (rejected a)
     .as-test!

  o 'concat(u) should do nothing for rejected tasks.' do
     for-all(AnyF, AnyF).satisfy (a, b) ->
       (rejected a).concat(Task.of b).is-equal (rejected a)
     .as-test!

  o 'chain(f) should do nothing for rejected tasks.' do
     for-all(AnyF, AnyF).satisfy (a, b) ->
       (rejected a).chain(-> Task.of b).is-equal (rejected a)
     .as-test!

  spec 'orElse(f)' (o) ->
    o 'Should do nothing for resolved tasks.' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         Task.of(a).or-else(-> rejected b).is-equal Task.of(a)
       .as-test!
    o 'Should propagate rejected tasks.' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         (rejected a).or-else(-> Task.of b).is-equal Task.of(b)
       .as-test!

  spec 'fold(f,g)' (o) ->
    o 'Should return a resolved task mapped by f if rejected.' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         (rejected a).fold(((x) -> [x, b]), ((x) -> [x, c])).is-equal Task.of([a, b])
       .as-test!
    o 'Should return a resolved task mapped by g if resolved.' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         Task.of(a).fold(((x) -> [x, b]), ((x) -> [x, c])).is-equal Task.of([a, c])
       .as-test!

  spec 'cata(p)' (o) ->
    o 'Should return a resolved task mapped by p.Rejected if rejected.' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         (rejected a).cata(Rejected: ((x) -> [x, b]), Resolved: ((x) -> [x, c])).is-equal Task.of([a, b])
       .as-test!
    o 'Should return a resolved task mapped by p.Resolved if resolved.' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         Task.of(a).cata(Rejected: ((x) -> [x, b]), Resolved: ((x) -> [x, c])).is-equal Task.of([a, c])
       .as-test!

  o 'Should swap the disjunction values.' do
     for-all(AnyF).satisfy (a) ->
       Task.of(a).swap!.is-equal (rejected a) and \
       (rejected a).swap!.is-equal Task.of(a)
     .as-test!

  spec 'bimap(f, g)' (o) ->
    o 'For rejected tasks should return a new rejected task mapped by f' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         (rejected a).bimap(k b; k c).is-equal (rejected b)
       .as-test!
    o 'For rights should return a new right mapped by f' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         Task.of(a).bimap(k b; k c).is-equal Task.of(c)
       .as-test!

  spec 'rejected-map(f)' (o) ->
    o 'For rejected tasks should return a new rejected task mapped by f' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         (rejected a).rejected-map(k b).is-equal (rejected b)
       .as-test!
    o 'For resolved tasks should return itself' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         Task.of(a).rejected-map(k b).is-equal Task.of(a)
       .as-test!

  spec 'cleanups' (o) ->
    o 'Actions should be able to clean after themselves.' do
       for-all(Any, Any).satisfy (a, b) ->
         state = []
         f = (a) -> new Task do
                               * (reject, resolve) -> resolve a
                               * -> state.push a
         f1 = f 'foo'
         f2 = f 'bar'
         f1.concat(f2).fork((->), (->))
         state === ['bar']
       .as-test!
    o 'Cleanup should propagate to other tasks.' do
       for-all(Any, Any).satisfy (a, b) ->
         state = []
         f = (a) -> new Task do
                               * (reject, resolve) -> resolve a
                               * -> state.push a
         f1 = f 'foo'
         f2 = f 'bar'
         f3 = f1.concat(f2).map(->)
         f3.cleanup!
         state === ['foo', 'bar']
       .as-test!
