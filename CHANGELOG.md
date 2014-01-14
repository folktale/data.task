## From 1.0.0 to 2.0.0

 -  **BREAKING:** removed partial functions and fields (`toString`, `isEqual`,
    `isPending`, `isResolved`, `isRejected`), since you can't observe them
    always, and it leads to confusing behaviour. This functionality will be
    moved to a co-future later.

 -  **BREAKING:** removed default memoisation. Since the Futures are just
    placeholders for actions, it does make sense that chaining a Future twice
    should execute the action twice. When you want memoisation, you can use the
    `Future.memoise` construct instead of `new Future`.

    ```js
    // Before:
    new Future(function(reject, resolve) { ... })

    // Now:
    Future.memoise(function(reject, resolve) { ... })
    ```

## 1.0.0

Initial release
