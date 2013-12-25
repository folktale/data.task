bin        = $(shell npm bin)
lsc        = $(bin)/lsc
browserify = $(bin)/browserify
groc       = $(bin)/groc
uglify     = $(bin)/uglifyjs
VERSION    = $(shell node -e 'console.log(require("./package.json").version)')


lib: src/*.ls
	$(lsc) -o lib -c src/*.ls

dist:
	mkdir -p dist

dist/data.future.umd.js: compile dist
	$(browserify) lib/index.js --standalone Future > $@

dist/data.future.umd.min.js: dist/data.future.umd.js
	$(uglify) --mangle - < $^ > $@

# ----------------------------------------------------------------------
bundle: dist/data.future.umd.js

minify: dist/data.future.umd.min.js

compile: lib

documentation:
	$(groc) --index "README.md"                                              \
	        --out "docs/literate"                                            \
	        src/*.ls test/*.ls test/specs/**.ls README.md

clean:
	rm -rf dist build lib

test:
	$(lsc) test/tap.ls

package: compile documentation bundle minify
	mkdir -p dist/data.future-$(VERSION)
	cp -r docs/literate dist/data.future-$(VERSION)/docs
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
