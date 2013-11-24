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

dist/monads.future.umd.js: compile dist
	$(browserify) lib/index.js --standalone Future > $@

dist/monads.future.umd.min.js: dist/monads.future.umd.js
	$(uglify) --mangle - < $^ > $@

# ----------------------------------------------------------------------
bundle: dist/monads.future.umd.js

minify: dist/monads.future.umd.min.js

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
	mkdir -p dist/monads.future-$(VERSION)
	cp -r docs/literate dist/monads.future-$(VERSION)/docs
	cp -r lib dist/monads.future-$(VERSION)
	cp dist/*.js dist/monads.future-$(VERSION)
	cp package.json dist/monads.future-$(VERSION)
	cp README.md dist/monads.future-$(VERSION)
	cp LICENCE dist/monads.future-$(VERSION)
	cd dist && tar -czf monads.future-$(VERSION).tar.gz monads.future-$(VERSION)

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
