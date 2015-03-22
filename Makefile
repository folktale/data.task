bin        = $(shell npm bin)
lsc        = $(bin)/lsc
browserify = $(bin)/browserify
jsdoc      = $(bin)/jsdoc
uglify     = $(bin)/uglifyjs
VERSION    = $(shell node -e 'console.log(require("./package.json").version)')

dist:
	mkdir -p dist

dist/data.task.umd.js: dist
	$(browserify) lib/index.js --standalone Task > $@

dist/data.future.umd.min.js: dist/data.task.umd.js
	$(uglify) --mangle - < $^ > $@

# ----------------------------------------------------------------------
bundle: dist/data.task.umd.js

minify: dist/data.task.umd.min.js

documentation:
	$(jsdoc) --configure jsdoc.conf.json
	ABSPATH=$(shell cd "$(dirname "$0")"; pwd) $(MAKE) clean-docs

clean-docs:
	perl -pi -e "s?$$ABSPATH/??g" ./docs/*.html

clean:
	rm -rf dist build

test:
	

benchmark:
	cd test/benchmarks && npm install
	node test/benchmarks/runner

package: documentation bundle minify
	mkdir -p dist/data.task-$(VERSION)
	cp -r docs dist/data.task-$(VERSION)
	cp -r lib dist/data.task-$(VERSION)
	cp dist/*.js dist/data.task-$(VERSION)
	cp package.json dist/data.task-$(VERSION)
	cp README.md dist/data.task-$(VERSION)
	cp LICENCE dist/data.task-$(VERSION)
	cd dist && tar -czf data.task-$(VERSION).tar.gz data.task-$(VERSION)

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
