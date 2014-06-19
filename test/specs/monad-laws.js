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
(function(){
  var spec, laws, Future, make;
  spec = require('hifive')();
  laws = require('laws');
  Future = require('../../lib/future');
  make = Future.of;
  module.exports = spec('Algebraic laws', function(o, spec){
    spec(': Functor', function(o){
      o('1. Identity', laws.functor.identity(make).asTest());
      return o('2. Composition', laws.functor.composition(make).asTest());
    });
    spec(': Chain', function(o){
      return o('1. Associativity', laws.chain.associativity(make).asTest());
    });
    spec(': Applicative', function(o){
      o('1. identity', laws.applicative.identity(make).asTest());
      o('2. composition', laws.applicative.composition(make).asTest());
      o('3. homomorphism', laws.applicative.homomorphism(make).asTest());
      return o('4. interchange', laws.applicative.interchange(make).asTest());
    });
    spec(': Monoid', function(o){
      o('1. left-identity', laws.monoid.leftIdentity(make).asTest());
      return o('2. right-identity', laws.monoid.rightIdentity(make).asTest());
    });
    spec(': Semigroup', function(o){
      return o('1. associativity', laws.semigroup.associativity(make).asTest());
    });
    return spec(': Monad', function(o){
      o('1. Left identity', laws.monad.leftIdentity(make).asTest());
      return o('2. Right identity', laws.monad.rightIdentity(make).asTest());
    });
  });
}).call(this);
