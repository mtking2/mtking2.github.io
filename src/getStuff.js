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
          return -1 * el.stargazers_count
        })
        .take(6)
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
        // .filter({ type: 'image',})
        .take(12)
        .value()

      cb(null, instagramGeneralData)
    })
}

var requestGoodreadsData = function(cb) {
  console.log('REQUEST: GOODREADS')
  axios
    .get('https://www.goodreads.com/review/list/69517269.xml?key=' + process.env.GOODREADS_KEY + '&v=2')
    .then(function(res) {
      console.log('RESPONSE: GOODREADS')

      let goodReadsXml = '\n' + res.data
      parseString(goodReadsXml, function(parseErr, result) {
        if (parseErr) {
          return cb(parseErr)
        }

        var parsed = _.chain(result.GoodreadsResponse.reviews[0].review)
          .map(review => {
            var book = review.book[0]

            return {
              title: book.title[0],
              author: _.get(book, 'authors[0].author[0].name'),
              url: book.link[0],
              thumbnail: book.large_image_url[0] || book.image_url[0] || book.small_image_url[0],
              myRating: review.rating[0] ? parseInt(review.rating[0], 10) : null,
              status: _.get(review, 'shelves[0].shelf[0].$.name'),
              date: new Date(review.date_updated[0])
            }
          })
          .sortBy(book => {
            return -book.date.getTime()
          })
          .sortBy(book => {
            const statusValue = {
              'currently-reading': 1,
              read: 2
            }

            return statusValue[book.status] || 3
          })
          .take(5)
          .value()

        cb(null, parsed)
      })
    })
    .catch(function(e) {
      console.error(e)
    })
}

module.exports = function(cb) {
  async.parallel([requestGithubData, requestInstagramData, requestGoodreadsData], function(
    err,
    results
  ) {
    if (err) cb(err)

    cb(null, {
      githubData: results[0],
      instagramData: results[1],
      goodreadsData: results[2]
    })
  })
}