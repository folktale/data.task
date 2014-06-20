var Future = require('./lib/future');

var res = getPost(1).concat(getComments(2));

res.fork(console.log, console.log)

function getPost(i) {
  return new Future(function(rej, res) {
    setTimeout(function(){
      res({id: i, title: 'Love them futures'})  
    }, 400)
  })
}

function getComments(i) {
  return new Future(function(rej, res) {
    setTimeout(function(){
      res(["This class should be illegal", "Monads are like space burritos"])
    }, 300)
  })
}

