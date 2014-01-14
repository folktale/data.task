# # Specification for Future

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

spec = (require 'hifive')!
Future = require '../eq-future'
{for-all, data: {Any:BigAny, Int}, sized, choice, transform} = require 'claire'
{ok, throws, equal} = require 'assert'


Any  = sized (-> 10), BigAny
AnyF = choice Any, (transform (-> Future.of it), AnyF)

k        = (a, b) --> a
id       = (a) -> a
rejected = (a) -> new Future (f, _) -> f a

module.exports = spec 'Future' (o, spec) ->

  o 'ap(b) should do nothing for rejected futures.' do
     for-all(AnyF, AnyF).satisfy (a, b) ->
       f = -> a
       (rejected f).ap(Future.of(b)).is-equal (rejected f)
     .as-test!

  o 'map(f) should do nothing for rejected futures.' do
     for-all(AnyF, AnyF).satisfy (a, b) ->
       (rejected a).map(-> b).is-equal (rejected a)
     .as-test!

  o 'chain(f) should do nothing for rejected futures.' do
     for-all(AnyF, AnyF).satisfy (a, b) ->
       (rejected a).chain(-> Future.of b).is-equal (rejected a)
     .as-test!

  spec 'orElse(f)' (o) ->
    o 'Should do nothing for resolved futures.' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         Future.of(a).or-else(-> rejected b).is-equal Future.of(a)
       .as-test!
    o 'Should propagate rejected futures.' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         (rejected a).or-else(-> Future.of b).is-equal Future.of(b)
       .as-test!

  spec 'fold(f,g)' (o) ->
    o 'Should return a resolved future mapped by f if rejected.' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         (rejected a).fold((-> b), (-> c)).is-equal Future.of(b)
       .as-test!
    o 'Should return a resolved future mapped by g if resolved.' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         Future.of(a).fold((-> b), (-> c)).is-equal Future.of(c)
       .as-test!

  o 'Should swap the disjunction values.' do
     for-all(AnyF).satisfy (a) ->
       Future.of(a).swap!.is-equal (rejected a) and \
       (rejected a).swap!.is-equal Future.of(a)
     .as-test!

  spec 'bimap(f, g)' (o) ->
    o 'For rejected futures should return a new rejected future mapped by f' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         (rejected a).bimap(k b; k c).is-equal (rejected b)
       .as-test!
    o 'For rights should return a new right mapped by f' do
       for-all(AnyF, AnyF, AnyF).satisfy (a, b, c) ->
         Future.of(a).bimap(k b; k c).is-equal Future.of(c)
       .as-test!

  spec 'rejected-map(f)' (o) ->
    o 'For rejected futures should return a new rejected future mapped by f' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         (rejected a).rejected-map(k b).is-equal (rejected b)
       .as-test!
    o 'For resolved futures should return itself' do
       for-all(AnyF, AnyF).satisfy (a, b) ->
         Future.of(a).rejected-map(k b).is-equal Future.of(a)
       .as-test!

  spec 'memoise(f)' (o) ->
    o 'Should compute the action at most once' do
      for-all(AnyF).satisfy (a) ->
        p = []
        f = Future.memoise (reject, resolve) ->
                              p.push a
                              resolve a
        f.map(id).is-equal (Future.of a) and \
        f.chain(Future.of).is-equal (Future.of a) and \
        p.length === 1
      .as-test!
