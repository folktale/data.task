Light serial tasks
==================

This scenario involves doing lightweight tasks, but where every task depends on
the value of the previous task, and as such must be run sequentially. This is
the worst case for concurrency, since you can't have concurrency at all, and
it's here because sometimes you have portions of your application where all
values depend on the previous one.

The scenario:

* An implementation receives a list of tasks;
* All tasks are of type `(Error, String → Void)`;
* Tasks much be ran sequentially, and their results collected in an array;
* If one of the tasks pass an `Error` value, the entire sequence should be
  aborted;
* The implementation should pass the collected array to the node-style
  callback;



