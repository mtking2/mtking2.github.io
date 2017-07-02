'use strict'

require('dotenv').load()

var async = require('async')
var request = require('superagent')
var _ = require('lodash')
const axios = require('axios')
const parseString = require('xml2js').parseString

var requestGithubData = function(cb) {
  console.log('REQUEST: GITHUB')
  request
    .get(
      'https://api.github.com/users/mtking2/repos?sort=updated&direction=desc&access_token=' +
        process.env.GITHUB_TOKEN
    )
    .end(function(err, res) {
      var githubData
      if (err) return cb(err)

      console.log('RESPONSE: GITHUB')
      // console.log(res.body)
      githubData = _(res.body)
        .filter(function(el) {
          return el.fork === false
        })
        .sortBy(function(el) {
          return -1 * el.forks
        })
        .take(9)
        .value()

      cb(null, githubData)
    })
}

var requestInstagramData = function(cb) {
  console.log('REQUEST: INSTAGRAM GENERAL')
  request
    .get(`https://api.instagram.com/v1/users/self/media/recent?access_token=${process.env.INSTAGRAM_TOKEN}`)
    .end(function(err, res) {
      var instagramGeneralData

      if (err) return cb(err)

      console.log('RESPONSE: INSTAGRAM GENERAL')
      // console.log(res.body.data)
      instagramGeneralData = _(res.body.data)
        // .sortBy(function(el, index) {
        //   return -1 * el.likes.count + index * 1.5
        // })
        .filter({ type: 'image' })
        .take(8)
        .value()

      cb(null, instagramGeneralData)
    })
}

module.exports = function(cb) {
  async.parallel([requestGithubData, requestInstagramData], function(
    err,
    results
  ) {
    if (err) cb(err)

    cb(null, {
      githubData: results[0],
      instagramData: results[1]
    })
  })
}
