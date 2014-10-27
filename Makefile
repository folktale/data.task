bin        = $(shell npm bin)
lsc        = $(bin)/lsc
browserify = $(bin)/browserify
jsdoc      = $(bin)/jsdoc
uglify     = $(bin)/uglifyjs
VERSION    = $(shell node -e 'console.log(require("./package.json").version)')

dist:
	mkdir -p dist

dist/data.future.umd.js: dist
	$(browserify) lib/index.js --standalone Future > $@

dist/data.future.umd.min.js: dist/data.future.umd.js
	$(uglify) --mangle - < $^ > $@

# ----------------------------------------------------------------------
bundle: dist/data.future.umd.js

minify: dist/data.future.umd.min.js

documentation:
	$(jsdoc) --configure jsdoc.conf.json
	ABSPATH=$(shell cd "$(dirname "$0")"; pwd) $(MAKE) clean-docs

clean-docs:
	perl -pi -e "s?$$ABSPATH/??g" ./docs/*.html

clean:
	rm -rf dist build

test:
	$(lsc) test/tap.ls

package: documentation bundle minify
	mkdir -p dist/data.future-$(VERSION)
	cp -r docs dist/data.future-$(VERSION)
	cp -r lib dist/data.future-$(VERSION)
	cp dist/*.js dist/data.future-$(VERSION)
	cp package.json dist/data.future-$(VERSION)
	cp README.md dist/data.future-$(VERSION)
	cp LICENCE dist/data.future-$(VERSION)
	cd dist && tar -czf data.future-$(VERSION).tar.gz data.future-$(VERSION)

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
