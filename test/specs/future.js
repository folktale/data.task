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
  var spec, Future, ref$, forAll, ref1$, BigAny, Int, sized, choice, transform, ok, throws, equal, Any, AnyF, k, id, rejected;
  spec = require('hifive')();
  Future = require('../eq-future');
  ref$ = require('claire'), forAll = ref$.forAll, ref1$ = ref$.data, BigAny = ref1$.Any, Int = ref1$.Int, sized = ref$.sized, choice = ref$.choice, transform = ref$.transform;
  ref$ = require('assert'), ok = ref$.ok, throws = ref$.throws, equal = ref$.equal;
  Any = sized(function(){
    return 10;
  }, BigAny);
  AnyF = choice(Any, transform(function(it){
    return Future.of(it);
  }, AnyF));
  k = curry$(function(a, b){
    return a;
  });
  id = function(a){
    return a;
  };
  rejected = function(a){
    return new Future(function(f, _){
      return f(a);
    });
  };
  module.exports = spec('Future', function(o, spec){
    o('map(f) should do nothing for rejected futures.', forAll(AnyF, AnyF).satisfy(function(a, b){
      return rejected(a).map(function(){
        return b;
      }).isEqual(rejected(a));
    }).asTest());
    o('ap(u) should do nothing for rejected futures.', forAll(AnyF, AnyF).satisfy(function(a, b){
      return Future.of(function(){
        return b;
      }).ap(rejected(a)).isEqual(rejected(a));
    }).asTest());
    o('concat(u) should do nothing for rejected futures.', forAll(AnyF, AnyF).satisfy(function(a, b){
      return rejected(a).concat(b).isEqual(rejected(a));
    }).asTest());
    o('chain(f) should do nothing for rejected futures.', forAll(AnyF, AnyF).satisfy(function(a, b){
      return rejected(a).chain(function(){
        return Future.of(b);
      }).isEqual(rejected(a));
    }).asTest());
    spec('orElse(f)', function(o){
      o('Should do nothing for resolved futures.', forAll(AnyF, AnyF).satisfy(function(a, b){
        return Future.of(a).orElse(function(){
          return rejected(b);
        }).isEqual(Future.of(a));
      }).asTest());
      return o('Should propagate rejected futures.', forAll(AnyF, AnyF).satisfy(function(a, b){
        return rejected(a).orElse(function(){
          return Future.of(b);
        }).isEqual(Future.of(b));
      }).asTest());
    });
    spec('fold(f,g)', function(o){
      o('Should return a resolved future mapped by f if rejected.', forAll(AnyF, AnyF, AnyF).satisfy(function(a, b, c){
        return rejected(a).fold(function(){
          return b;
        }, function(){
          return c;
        }).isEqual(Future.of(b));
      }).asTest());
      return o('Should return a resolved future mapped by g if resolved.', forAll(AnyF, AnyF, AnyF).satisfy(function(a, b, c){
        return Future.of(a).fold(function(){
          return b;
        }, function(){
          return c;
        }).isEqual(Future.of(c));
      }).asTest());
    });
    o('Should swap the disjunction values.', forAll(AnyF).satisfy(function(a){
      return Future.of(a).swap().isEqual(rejected(a)) && rejected(a).swap().isEqual(Future.of(a));
    }).asTest());
    spec('bimap(f, g)', function(o){
      o('For rejected futures should return a new rejected future mapped by f', forAll(AnyF, AnyF, AnyF).satisfy(function(a, b, c){
        return rejected(a).bimap(k(b), k(c)).isEqual(rejected(b));
      }).asTest());
      return o('For rights should return a new right mapped by f', forAll(AnyF, AnyF, AnyF).satisfy(function(a, b, c){
        return Future.of(a).bimap(k(b), k(c)).isEqual(Future.of(c));
      }).asTest());
    });
    spec('rejected-map(f)', function(o){
      o('For rejected futures should return a new rejected future mapped by f', forAll(AnyF, AnyF).satisfy(function(a, b){
        return rejected(a).rejectedMap(k(b)).isEqual(rejected(b));
      }).asTest());
      return o('For resolved futures should return itself', forAll(AnyF, AnyF).satisfy(function(a, b){
        return Future.of(a).rejectedMap(k(b)).isEqual(Future.of(a));
      }).asTest());
    });
    return spec('memoise(f)', function(o){
      return o('Should compute the action at most once', forAll(AnyF).satisfy(function(a){
        var p, f;
        p = [];
        f = Future.memoise(function(reject, resolve){
          p.push(a);
          return resolve(a);
        });
        return f.map(id).isEqual(Future.of(a)) && f.chain(Future.of).isEqual(Future.of(a)) && deepEq$(p.length, 1, '===');
      }).asTest());
    });
  });
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
  function deepEq$(x, y, type){
    var toString = {}.toString, hasOwnProperty = {}.hasOwnProperty,
        has = function (obj, key) { return hasOwnProperty.call(obj, key); };
    first = true;
    return eq(x, y, []);
    function eq(a, b, stack) {
      var className, length, size, result, alength, blength, r, key, ref, sizeB;
      if (a == null || b == null) { return a === b; }
      if (a.__placeholder__ || b.__placeholder__) { return true; }
      if (a === b) { return a !== 0 || 1 / a == 1 / b; }
      className = toString.call(a);
      if (toString.call(b) != className) { return false; }
      switch (className) {
        case '[object String]': return a == String(b);
        case '[object Number]':
          return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
        case '[object Date]':
        case '[object Boolean]':
          return +a == +b;
        case '[object RegExp]':
          return a.source == b.source &&
                 a.global == b.global &&
                 a.multiline == b.multiline &&
                 a.ignoreCase == b.ignoreCase;
      }
      if (typeof a != 'object' || typeof b != 'object') { return false; }
      length = stack.length;
      while (length--) { if (stack[length] == a) { return true; } }
      stack.push(a);
      size = 0;
      result = true;
      if (className == '[object Array]') {
        alength = a.length;
        blength = b.length;
        if (first) { 
          switch (type) {
          case '===': result = alength === blength; break;
          case '<==': result = alength <= blength; break;
          case '<<=': result = alength < blength; break;
          }
          size = alength;
          first = false;
        } else {
          result = alength === blength;
          size = alength;
        }
        if (result) {
          while (size--) {
            if (!(result = size in a == size in b && eq(a[size], b[size], stack))){ break; }
          }
        }
      } else {
        if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) {
          return false;
        }
        for (key in a) {
          if (has(a, key)) {
            size++;
            if (!(result = has(b, key) && eq(a[key], b[key], stack))) { break; }
          }
        }
        if (result) {
          sizeB = 0;
          for (key in b) {
            if (has(b, key)) { ++sizeB; }
          }
          if (first) {
            if (type === '<<=') {
              result = size < sizeB;
            } else if (type === '<==') {
              result = size <= sizeB
            } else {
              result = size === sizeB;
            }
          } else {
            first = false;
            result = size === sizeB;
          }
        }
      }
      stack.pop();
      return result;
    }
  }
}).call(this);
