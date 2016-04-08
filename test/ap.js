var Task = require('../');
var test = require('tape');

test('Task#ap(aTask) starts both tasks concurrently', function(t) {
  var t1_status = 'pending';
  var t2_status = 'pending';

  var t1 = new Task(function(reject, resolve) {
    t1_status = 'running';

    setTimeout(function() {
      t.equal(t2_status, 'running', 'Task 2 is running');
    });
    setTimeout(function() {
      t1_status = 'done';
      resolve(function(x){
        t.equal(x, 1, 'X is Task 2`s value.');
        return x + 1;
      });
    }, 1000);
  });

  var t2 = new Task(function(reject, resolve) {
    t2_status = 'running';

    setTimeout(function() {
      t.equal(t1_status, 'running', 'Task 1 is running');
    });

    setTimeout(function() {
      t2_status = 'done';
      resolve(1);
    }, 1000);
  });

  t1.ap(t2).fork(
    function onError(e){ t.fail('.ap should succeed'); t.end(); },
    function(value) {
      t.equal(value, 2, 'Result of the task should be 2');
      t.end();
    }
  );
});

test('Task#ap(aTask) applicative function behaviour', function(t) {
  Task.of(function(x){ return x + 1; }).ap(Task.of(1)).fork(
    function onError(e){ t.fail('.ap should succeed'); t.end(); },
    function(value) {
      t.equal(value, 2, 'Result of the task should be 2');
      t.end();
    }
  );
});

test('Task#ap(aTask) should fail once if one fails', function(t) {
  var failures = 0;
  var rejections = 0;

  var t1 = new Task(function(reject, resolve) {
    reject(2);
    ++rejections;
  });

  var t2 = new Task(function(reject, resolve) {
    reject(1);
    ++rejections;
  });

  t1.ap(t2).fork(
    function onError(e) { ++failures; },
    function onSuccess(x) { }
  );

  setTimeout(function() {
    t.equal(failures, 1, 'Fail just once');
    t.end();
  }, 100);
});

