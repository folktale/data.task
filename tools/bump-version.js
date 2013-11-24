var pkg = require('../package.json')
var fs  = require('fs')

function minor(a) {
  return [a[0], a[1], Number(a[2]) + 1] }

function feature(a) {
  return [a[0], Number(a[1]) + 1, 0] }

function major(a) {
  return [Number(a[0]) + 1, 0, 0] }

function bump(what, version) {
  return what === 'MAJOR'?    major(version)
  :      what === 'FEATURE'?  feature(version)
  :      /* otherwise */      minor(version) }

pkg.version = bump(process.argv[2], pkg.version.split('.')).join('.')
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))
