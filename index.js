'use strict'

const { parse } = require('cjson')
const { isString } = require('lodash')
const { getOptions } = require('loader-utils')
const { escapeRegExp } = require('lodash')

const fs = require('fs')
const util = require('util')
const path = require('path')
const chalk = require('chalk')
const Table = require('text-table')
const findUp = require('find-up')
const htmllint = require('htmllint')
const stripAnsi = require('strip-ansi')

module.exports = htmllintLoader

function HtmlLintError(message) {
  Error.call(this)
  this.name = 'HtmlLintError'
  this.message = message
  Error.captureStackTrace(this, HtmlLintError)
}

HtmlLintError.prototype = Object.create(Error.prototype)
HtmlLintError.prototype.constructor = HtmlLintError

function pluralize(word, count) {
  return (count === 1 ? word : `${word}s`)
}

function stringLength(str) {
  return stripAnsi(str).length
}

function renderIssue(issue) {
  if (issue.code === 'E011' && issue.data.value && issue.data.format) {
    return `'${issue.data.value}' must match ${issue.data.format}`
  } else {
    return htmllint.messages.renderIssue(issue)
  }
}

function stylish(resourcePath, issues) {
  const align = [ '', 'r', 'c', 'l' ]
  const problem = 'problem'
  const separator = ':line-col-separator:'
  const separatorRE = RegExp(`\\s*${escapeRegExp(separator)}\\s*`, 'g')
  const separatorReplacer = chalk.white.dim(':')

  const rows = issues.map((issue) => ([
    '',
    chalk.white.dim(`${issue.line}`),
    separator,
    chalk.white.dim(`${issue.line}`),
    chalk.yellow(problem),
    chalk.white(renderIssue(issue)),
    chalk.white.dim(issue.rule)
  ]))

  const header = chalk.white.underline(resourcePath)
  const table = Table(rows, { align, stringLength }).replace(separatorRE, separatorReplacer)
  const footer = chalk.yellow.bold(`\u2716 HtmlLint found ${issues.length} ${pluralize('problem')}`)
  const output = `\n${header}\n${table}\n\n${footer}\n`

  return output
}

function readFile(resourcePath) {
  return util.promisify(fs.readFile)(resourcePath, 'utf8')
}

function findConfig(configPath, resourcePath) {
  if (isString(configPath)) {
    return Promise.resolve(configPath)
  }

  return findUp('.htmllintrc', { cwd: path.dirname(resourcePath) }).then((configPath) => {
    if (isString(configPath)) {
      return configPath
    } else {
      return path.resolve('.htmllintrc')
    }
  })
}

function htmllintLoader(source) {
  const webpack = this
  const options = getOptions(webpack)
  const callback = webpack.async()
  webpack.cacheable()

  const cwd = process.cwd()
  const shortResourcePath = webpack.resourcePath.indexOf(cwd) === 0
    ? webpack.resourcePath.substr(cwd.length + 1)
    : webpack.resourcePath

  findConfig(options.config, webpack.resourcePath).then((configPath) => {
    webpack.addDependency(configPath)
    return readFile(configPath).then(parse)
  }).then((config) => {
    htmllint.use(config.plugins || [])
    delete config.plugins
    return htmllint(source, config)
  }).then((issues) => {
    if (issues.length !== 0) {
      const output = stylish(shortResourcePath, issues)
      const report = new HtmlLintError(output)
      options.failOnProblem
        ? webpack.emitError(report)
        : webpack.emitWarning(report)
    }
  }).then(() => {
    callback(null, source)
  }, (err) => {
    callback(err)
  })
}
