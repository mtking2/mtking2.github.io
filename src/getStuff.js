'use strict'

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config()
// const envConfig = dotenv.parse(fs.readFileSync('.env'))

const async = require('async')
const request = require('superagent')
const _ = require('lodash')
const axios = require('axios')
const parseString = require('xml2js').parseString
const fm = require('front-matter')

var updateEnv = function() {
  console.log(envConfig)

  var envStr = []
  for (let k in envConfig) {
    envStr.push(`${k}=${envConfig[k]}`)
  }

  // console.log(envStr.join("\n"))

  fs.writeFile('.env', envStr.join("\n"), function(err) {
    if (err) return console.error(err)
    console.log('UPDATED FILE: .env')
  })
}

var requestGithubData = function(cb) {
  console.log('REQUEST: GITHUB')
  request
    .get('https://api.github.com/users/mtking2/repos?sort=updated&direction=desc')
    .set('User-Agent', 'pug-site')
    .set('Authorization', `Basic ${process.env.GITHUB_KEY}`)
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

  let today = new Date()
  let refreshDate = new Date(`${process.env.INSTAGRAM_TOKEN_REFRESH}`)
  let expireDate = new Date(`${process.env.INSTAGRAM_TOKEN_EXPIRE}`)
  // console.log(`${process.env.INSTAGRAM_TOKEN_EXPIRE} ${expireDate}`)

  console.log(`INFO: INSTAGRAM TOKEN: time to refresh: ${((refreshDate - today) / 86400000).toFixed(2)} days, time to expire: ${((expireDate - today) / 86400000).toFixed(2)} days`)

  // if (today > refreshDate) {
  //   request
  //     .get(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${process.env.INSTAGRAM_GRAPH_TOKEN}`)
  //     .end(function(err, res) {
  //       if (err) return cb(err)

  //       console.log('RESPONSE: INSTAGRAM TOKEN REFRESH')
  //       // console.log(res.body)
  //       let newTokenExpire = new Date(new Date().getTime() + (res.body.expires_in*1000))
  //       let newTokenExpireDate = newTokenExpire.toISOString().slice(0, 10)
  //       let newTokenRefreshDate = new Date(newTokenExpire.getTime() - (5*86400000)).toISOString().slice(0, 10)

  //       console.log(`INSTAGRAM TOKEN REFRESHED: (refresh on ${newTokenRefreshDate} : expires on ${newTokenExpireDate})`)

  //       envConfig.INSTAGRAM_GRAPH_TOKEN = res.body.access_token
  //       envConfig.INSTAGRAM_TOKEN_EXPIRE = newTokenExpireDate
  //       envConfig.INSTAGRAM_TOKEN_REFRESH = newTokenRefreshDate
  //       updateEnv()
  //     })
  // }

  request
    .get(`https://graph.instagram.com/${process.env.INSTAGRAM_USER_ID}/media?fields=media_url,permalink,media_type,caption&access_token=${process.env.INSTAGRAM_GRAPH_TOKEN}`)
    .end(function(err, res) {
      if (err) return cb(err)
      var instagramMediaData
      console.log('RESPONSE: INSTAGRAM MEDIA')
      // console.log(res.body.data)

      instagramMediaData = _(res.body.data)
        .filter((post) => {
          if (post.media_type == 'IMAGE' || post.media_type == 'CAROUSEL_ALBUM') {
            return post
          }
        }).take(12).value()

      // console.log(instagramMediaData)

      cb(null, instagramMediaData)
    })

  // request
  //   .get(`https://api.instagram.com/v1/users/self/media/recent?access_token=${process.env.INSTAGRAM_TOKEN}`)
  //   .end(function(err, res) {
  //     var instagramGeneralData
  //
  //     if (err) return cb(err)
  //
  //     console.log('RESPONSE: INSTAGRAM GENERAL')
  //     // console.log(res.body.data)
  //     instagramGeneralData = _(res.body.data)
  //       // .sortBy(function(el, index) {
  //       //   return -1 * el.likes.count + index * 1.5
  //       // })
  //       .filter((post) => {
  //         if (post.type == 'image' || post.type == 'carousel') {
  //           return post
  //         }
  //       }).take(12).value()
  //
  //     cb(null, instagramGeneralData)
  //   })
}

function getReadingNotesData(isbn) {
  return new Promise(function(resolve, reject) {
    if (!isbn) return resolve()

    let rnURL = `https://raw.githubusercontent.com/mtking2/reading-notes/master/src/books/${isbn}.md`
    request.get(rnURL).end( (err, resp) => {
      if (err && resp.status !== 404) return reject();

      // console.log(resp.status)
      if (resp.status < 400) {
        // console.log(resp.text)
        let rnData = fm(resp.text).attributes;
        // console.log(rnData)
        resolve(rnData)
      }

      return resolve({})
    });
  });
}

var requestGoodreadsData = async function(cb) {
  console.log('REQUEST: GOODREADS CR')
  var books = []
  var reading_count;
  axios.get('https://www.goodreads.com/review/list/69517269.xml?key=' + process.env.GOODREADS_KEY + '&v=2&sort=date_read&shelf=currently-reading&per_page=10')
  .then(async (res) => {
    console.log('RESPONSE: GOODREADS CR')
    // console.log(res.data);
    let goodReadsXml = '\n' + res.data
    parseString(goodReadsXml, function(parseErr, result) {
      if (parseErr) {
        return cb(parseErr)
      }

      var reading = _.chain(result.GoodreadsResponse.reviews[0].review).map(review => {
        var book = review.book[0]
        // console.log(book)

        return {
          title: book.title[0],
          author: _.get(book, 'authors[0].author[0].name'),
          isbn13: book.isbn13[0],
          url: book.link[0],
          thumbnail: book.large_image_url[0] || book.image_url[0].replace(/\._.*_\./, '.') || book.image_url[0] || book.small_image_url[0],
          myRating: review.rating[0] ? parseInt(review.rating[0], 10) : null,
          status: 'currently-reading', // _.get(review, 'shelves[0].shelf[0].$.name'),
          date: new Date(review.date_updated[0])
        }
      }).sortBy(book => {
        return -book.date.getTime()
      }).value()

      reading.forEach((e) => { books.push(e) })
      reading_count = reading.length
      // console.log(books)
    })
  }).then( async (res) => {
    console.log('REQUEST: GOODREADS READ')
    axios.get('https://www.goodreads.com/review/list/69517269.xml?key=' + process.env.GOODREADS_KEY + '&v=2&sort=date_read&shelf=read&per_page=100')
    .then(function(res) {
      console.log('RESPONSE: GOODREADS READ')
      // console.log(res.data);
      let goodReadsXml = '\n' + res.data
      parseString(goodReadsXml, function(parseErr, result) {
        if (parseErr) {
          return cb(parseErr)
        }

        var read = _.chain(result.GoodreadsResponse.reviews[0].review).map(review => {
          var book = review.book[0]

          return {
            title: book.title[0],
            author: _.get(book, 'authors[0].author[0].name'),
            isbn13: book.isbn13[0],
            url: book.link[0],
            thumbnail: book.large_image_url[0] || book.image_url[0].replace(/\._.*_\./, '.') || book.image_url[0] || book.small_image_url[0],
            myRating: review.rating[0] ? parseInt(review.rating[0], 10) : null,
            status: _.get(review, 'shelves[0].shelf[0].$.name'),
            date: new Date(review.read_at[0])
          }
        }).take(10 - reading_count).value()

        read.forEach((e) => { books.push(e) })
        // console.log(books)

        // broken image fix
        // books.find((b) => {
        //   return b.isbn13 === '9781491901427'
        // }).thumbnail = 'https://images.gr-assets.com/books/1441160483l/25445846.jpg'
        books.find((b) => {
          return b.isbn13 === '9780465007806'
        }).thumbnail = 'https://images.gr-assets.com/books/1389237768l/33279.jpg'
        // books.find((b) => {
        //   return b.isbn13 === '9780061767647'
        // }).thumbnail = 'https://images.gr-assets.com/books/1348718213l/6715623.jpg'

        // console.log(books)
        // cb(null, books)
      })
    }).then( async (res) => {
      for (let i in books) {
        let book = books[i];
        if (book.status === 'currently-reading') {
          let readingNotesData = await getReadingNotesData(book.isbn13)
          // console.log(readingNotesData)
          let date = new Date(new Date().setHours(0,0,0,0))
          let hasNewNotes = new Date(readingNotesData.updated) > date.setDate(date.getDate() - 30)
          book.hasNewNotes = hasNewNotes;
          book.notesLastUpdated = new Date(readingNotesData.updated).toDateString();
        }
      }
      // console.log(books)
      cb(null, books)
    }).catch(function(e) {
      console.error(e)
    })
  }).catch(function(e) {
    console.error(e)
  })
}


var requestLetterboxdData = function(cb) {
  console.log('REQUEST: Letterboxd')
  let films = [];
  axios.get('https://letterboxd.com/mtking2/rss')
  .then(function(resp) {
    console.log('RESPONSE: Letterboxd')
    // console.log(resp.data)

    let letterboxdXml = '\n' + resp.data
    parseString(letterboxdXml, function(parseErr, result) {
      if (parseErr) {
        return cb(parseErr)
      }

      let data = result.rss.channel[0];
      data.item.filter( (m) => {
        return /letterboxd-(watch|review)/.test(m.guid[0]['_'])
      }).forEach( (movie) => {
        films.push({
          title: movie['letterboxd:filmTitle'][0],
          guid: movie.guid[0]['_'],
          link: movie.link[0].replace('mtking2/','').replace(/\/\d*\/$/,''),
          watch_date: movie['letterboxd:watchedDate'][0],
          rewatch: movie['letterboxd:rewatch'][0],
          rating: movie['letterboxd:memberRating'][0],
          image_url: /src=\"(.*)\"/gm.exec(movie.description[0])[1]
        })
      });

      var letterboxdData = _(films)
        .sortBy(function(m) {
          return -1 * Date.parse(m.watch_date)
        })
        .take(15)
        .value()

      // console.log(letterboxdData)
      cb(null, letterboxdData)
    })
  }).catch(function(e) {
    console.error(e)
  })
}

module.exports = function(cb) {
  async.parallel([requestGithubData, requestInstagramData, requestGoodreadsData, requestLetterboxdData], function(
    err,
    results
  ) {
    if (err) cb(err)

    cb(null, {
      githubData: results[0],
      instagramData: results[1],
      goodreadsData: results[2],
      letterboxdData: results[3]
    })
  })
}
