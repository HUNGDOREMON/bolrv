module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "standard",
    "parserOptions": {
        "sourceType": "module"
    },
    "globals": {
        "moment": true
    },
    "rules": {
        "indent": ["error", 4],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-new": 0,
        "no-trailing-spaces": [
            "error", 
            { "ignoreComments": true }
        ],
        "eol-last": ["error", "always"],
        "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }]
    }
};