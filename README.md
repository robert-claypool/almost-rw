# Almost Random Words
See http://robert-claypool.github.io/almost-rw/

This project is a simple page to request random words from a [popular Diceware words list](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases). It uses a cryptographically sound method, but please use [physical entropy](http://world.std.com/~reinhold/dicewarefaq.html#electronic) for your highest security applications.

Selection of words happens in the browser. If you run this locally, no Internet access is required.

## Running Locally
https://github.com/indexzero/http-server is an easy choice, but any web server will do.
```Shell
git clone https://github.com/robert-claypool/almost-rw.git
cd almost-rw
npm install --global http-server
http-server # defaults to port 8080, http://localhost:8080/index.html
```

## Linting the Code
```Shell
npm install # Install packages
npm install --global grunt-cli # Grunt CLI must be globally installed
grunt
```

## Build
There is no build.
