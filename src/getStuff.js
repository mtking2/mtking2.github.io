"use strict"

const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")
dotenv.config()
// const envConfig = dotenv.parse(fs.readFileSync(".env"))

const async = require("async")
const request = require("superagent")
const _ = require("lodash")
const axios = require("axios")
const parseString = require("xml2js").parseString

// const fm = require("front-matter")

// var updateEnv = function() {
//   console.log(envConfig)

//   var envStr = []
//   for (let k in envConfig) {
//     envStr.push(`${k}=${envConfig[k]}`)
//   }

//   // console.log(envStr.join("\n"))

//   fs.writeFile('.env', envStr.join("\n"), function(err) {
//     if (err) return console.error(err)
//     console.log('UPDATED FILE: .env')
//   })
// }

const requestGooglePhotosData = function (cb) {
	console.log("LOAD: G_PHOTOS")

	const photosJSON = path.join(__dirname, "..", "dist", "assets", "photos", "photos.json")

	fs.readFile(photosJSON, "utf8", (err, jsonString) => {
		if (err) {
			console.log("Error reading file:", err)
			return
		}
		try {
			// Parse JSON string to object
			const data = JSON.parse(jsonString)
			console.log("RESPONSE: G_PHOTOS", data.photos.length)
			cb(null, data.photos)
		} catch (err) {
			console.log("Error parsing JSON string:", err)
		}
	})
}

const requestGithubData = function (cb) {
	console.log("REQUEST: GITHUB")
	request
		.get("https://api.github.com/users/mtking2/repos?sort=updated&direction=desc")
		.set("User-Agent", "pug-site")
		.set("Authorization", `Basic ${process.env.GH_KEY}`)
		.end(function (err, res) {
			var githubData
			if (err) return cb(err)

			console.log("RESPONSE: GITHUB")
			// console.log(res.body)
			githubData = _(res.body)
				.filter(function (el) {
					return el.fork === false
				})
				.sortBy(function (el) {
					return -1 * el.stargazers_count
				})
				.take(6)
				.value()

			cb(null, githubData)
		})
}

// function getReadingNotesData(isbn) {
//   return new Promise(function(resolve, reject) {
//     if (!isbn) return resolve()

//     let rnURL = `https://raw.githubusercontent.com/mtking2/reading-notes/master/src/books/${isbn}.md`
//     request.get(rnURL).end( (err, resp) => {
//       if (err && resp.status !== 404) return reject();

//       // console.log(resp.status)
//       if (resp.status < 400) {
//         // console.log(resp.text)
//         let rnData = fm(resp.text).attributes;
//         // console.log(rnData)
//         resolve(rnData)
//       }

//       return resolve({})
//     });
//   });
// }

const getGoodreadsBooks = async function (shelf) {
	let books = []
	console.log(`REQUEST: GOODREADS ${shelf.toUpperCase()}`)
	await axios
		.get(
			`https://www.goodreads.com/review/list/69517269.xml?key=${process.env.GOODREADS_KEY}&v=2&sort=date_read&shelf=${shelf}&per_page=10`,
		)
		.then(async (res) => {
			console.log(`RESPONSE: GOODREADS ${shelf.toUpperCase()}`)
			// console.log(res.data);
			let goodReadsXml = "\n" + res.data
			return parseString(goodReadsXml, function (parseErr, result) {
				if (parseErr) {
					return cb(parseErr)
				}

				var bookList = _.chain(result.GoodreadsResponse.reviews[0].review)
					.map((review) => {
						var book = review.book[0]
						// console.log(book)

						return {
							title: book.title[0],
							author: _.get(book, "authors[0].author[0].name[0]"),
							isbn13: book.isbn13[0],
							url: book.link[0],
							thumbnail:
								book.large_image_url[0] ||
								book.image_url[0].replace(/\._.*_\./, ".") ||
								book.image_url[0] ||
								book.small_image_url[0],
							myRating: review.rating[0] ? parseInt(review.rating[0], 10) : null,
							status: shelf, // _.get(review, 'shelves[0].shelf[0].$.name'),
							date: new Date(review.date_updated[0]),
						}
					})
					.sortBy((book) => {
						return -book.date.getTime()
					})
					.value()

				// broken image fix
				let imageOverridesIsbn = {
					"9780465007806": "https://images.gr-assets.com/books/1389237768l/33279.jpg",
					"9781788734318": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1629218849i/58794920.jpg",
				}
				let imageOverridesTitle = {
					"The Disordered Cosmos: A Journey into Dark Matter, Spacetime, and Dreams Deferred":
						"https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1595829604i/54697346.jpg",
				}
				bookList.forEach((b) => {
					if (imageOverridesIsbn[b.isbn13]) {
						b.thumbnail = imageOverridesIsbn[b.isbn13]
					}
					if (imageOverridesTitle[b.title]) {
						b.thumbnail = imageOverridesTitle[b.title]
					}
				})

				// console.log(bookList)

				books = bookList
			})
		})
		.catch(function (e) {
			console.error(e)
			cb(e)
		})
	return books
}

var requestGoodreadsData = async function (cb) {
	let crBooks = await getGoodreadsBooks("currently-reading")
	let readBooks = await getGoodreadsBooks("read")
	// console.log({ crBooks, readBooks })
	let books = [...crBooks, ..._.take(readBooks, 10 - crBooks.length)]
	cb(null, books)
}

var requestLetterboxdData = function (cb) {
	console.log("REQUEST: Letterboxd")
	let films = []
	axios
		.get("https://letterboxd.com/mtking2/rss")
		.then(function (resp) {
			console.log("RESPONSE: Letterboxd")
			// console.log(resp.data)

			let letterboxdXml = "\n" + resp.data
			parseString(letterboxdXml, function (parseErr, result) {
				if (parseErr) {
					return cb(parseErr)
				}

				let data = result.rss.channel[0]
				data.item
					.filter((m) => {
						return /letterboxd-(watch|review)/.test(m.guid[0]["_"])
					})
					.forEach((movie) => {
						films.push({
							title: movie["letterboxd:filmTitle"][0],
							guid: movie.guid[0]["_"],
							link: movie.link[0].replace("mtking2/", "").replace(/\/\d*\/$/, ""),
							watch_date: movie["letterboxd:watchedDate"][0],
							rewatch: movie["letterboxd:rewatch"][0],
							rating: movie["letterboxd:memberRating"][0],
							image_url: /src=\"(.*)\"/gm.exec(movie.description[0])[1],
						})
					})

				var letterboxdData = _(films)
					.sortBy(function (m) {
						return -1 * Date.parse(m.watch_date)
					})
					.take(15)
					.value()

				// console.log({letterboxdData})
				cb(null, letterboxdData)
			})
		})
		.catch(function (e) {
			console.error(e)
			cb(e)
		})
}

module.exports = function (cb) {
	async.parallel(
		[requestGithubData, requestGoodreadsData, requestLetterboxdData, requestGooglePhotosData],
		function (err, results) {
			if (err) cb(err)

			cb(null, {
				githubData: results[0],
				goodreadsData: results[1],
				letterboxdData: results[2],
				googlePhotosData: results[3],
			})
		},
	)
}
