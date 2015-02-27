bin        = $(shell npm bin)
lsc        = $(bin)/lsc
browserify = $(bin)/browserify
jsdoc      = $(bin)/jsdoc
uglify     = $(bin)/uglifyjs
VERSION    = $(shell node -e 'console.log(require("./package.json").version)')

dist:
	mkdir -p dist

dist/data.Task.umd.js: dist
	$(browserify) lib/index.js --standalone Task > $@

dist/data.Task.umd.min.js: dist/data.Task.umd.js
	$(uglify) --mangle - < $^ > $@

# ----------------------------------------------------------------------
bundle: dist/data.Task.umd.js

minify: dist/data.Task.umd.min.js

documentation:
	$(jsdoc) --configure jsdoc.conf.json
	ABSPATH=$(shell cd "$(dirname "$0")"; pwd) $(MAKE) clean-docs

clean-docs:
	perl -pi -e "s?$$ABSPATH/??g" ./docs/*.html

clean:
	rm -rf dist build

test:
	$(lsc) test/tap.ls

benchmark:
	cd test/benchmarks && npm install
	node test/benchmarks/runner

package: documentation bundle minify
	mkdir -p dist/data.Task-$(VERSION)
	cp -r docs dist/data.Task-$(VERSION)
	cp -r lib dist/data.Task-$(VERSION)
	cp dist/*.js dist/data.Task-$(VERSION)
	cp package.json dist/data.Task-$(VERSION)
	cp README.md dist/data.Task-$(VERSION)
	cp LICENCE dist/data.Task-$(VERSION)
	cd dist && tar -czf data.Task-$(VERSION).tar.gz data.Task-$(VERSION)

publish: clean
	npm install
	npm publish

bump:
	node tools/bump-version.js $$VERSION_BUMP

bump-feature:
	VERSION_BUMP=FEATURE $(MAKE) bump

bump-major:
	VERSION_BUMP=MAJOR $(MAKE) bump

.PHONY: test
