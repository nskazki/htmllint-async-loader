## htmllint-async-loader

Yet another [htmllint](https://github.com/htmllint/htmllint) loader. Tested with [webpack@3](https://github.com/webpack/webpack).

- Like [robbiedigital/htmllint-loader](https://github.com/robbiedigital/htmllint-loader) but without [deasync](https://github.com/abbr/deasync) usage.
- Like [GideonPARANOID/htmllint-loader](https://github.com/GideonPARANOID/htmllint-loader) but with better output formatting.

```
yarn -D htmllint-async-loader
```

```javascript
module.exports = {
  module: {
    rules: [{
      test: /\.(html|ejs)$/),
      enforce: 'pre',
      loader: 'htmllint-async-loader',
      options: {
        config: '.htmllintrc',
        failOnProblem: false
      }
    }]
  }
}
```

![image](https://user-images.githubusercontent.com/6743076/42134605-e4da7756-7d47-11e8-8f63-ac466172e7dc.png)
