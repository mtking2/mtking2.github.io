"use strict"

// const fs = require("fs")
// const path = require("path")
const dotenv = require("dotenv")
dotenv.config()
// const envConfig = dotenv.parse(fs.readFileSync(".env"))

const async = require("async")
const request = require("superagent")
const _ = require("lodash")
const axios = require("axios")
const parseString = require("xml2js").parseString
const { google } = require("googleapis")

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

async function getGoogleAccessToken() {
	const oauth2Client = new google.auth.OAuth2(
		process.env.G_PHOTOS_CLIENT_ID,
		process.env.G_PHOTOS_CLIENT_SECRET,
		"urn:ietf:wg:oauth:2.0:oob",
	)

	oauth2Client.setCredentials({
		refresh_token: process.env.G_PHOTOS_REFRESH_TOKEN,
	})

	const { token } = await oauth2Client.getAccessToken()
	return token
}

const listGooglePhotoAlbums = async function () {
	const accessToken = await getGoogleAccessToken()
	const response = await axios.get("https://photoslibrary.googleapis.com/v1/albums", {
		headers: { Authorization: `Bearer ${accessToken}` },
	})

	return response.data.albums
}

const listGoogleAlbumPhotos = async function (albumId) {
	const accessToken = await getGoogleAccessToken()
	const response = await axios.post(
		"https://photoslibrary.googleapis.com/v1/mediaItems:search",
		{ albumId: albumId, pageSize: 12 },
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	)

	return response.data.mediaItems
}

const listGooglePhotosFavorites = async function () {
	const accessToken = await getGoogleAccessToken()
	const response = await axios.post(
		"https://photoslibrary.googleapis.com/v1/mediaItems:search",
		{ filters: { featureFilter: { includedFeatures: ["FAVORITES"] } } },
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	)

	return _.take(response.data.mediaItems, 12)
}

const requestGooglePhotosData = function (cb) {
	console.log("REQUEST: G_PHOTOS")

	// listGooglePhotoAlbums()
	// 	.then((albums) => {
	// 		albums.forEach((album) => {
	// 			console.log(`Album ID: ${album.id}, Title: ${album.title}`)
	// 		})
	// 	})
	// 	.catch((error) => {
	// 		console.error("Error fetching albums:", error)
	// 	})

	// listGoogleAlbumPhotos(process.env.G_PHOTOS_ALBUM_ID)
	// 	.then((photos) => {
	// 		console.log("GOOGLE PHOTOS:", photos)
	// 		cb(null, photos)
	// 	})
	// 	.catch((error) => {
	// 		console.error("Error fetching photos:", error)
	// 	})

	listGooglePhotosFavorites()
		.then((photos) => {
			// console.log("GOOGLE PHOTOS:", photos)
			// console.log(photos.map((p) => p.mediaMetadata.photo))
			console.log("RESPONSE: G_PHOTOS", photos.length)
			cb(null, photos)
		})
		.catch((error) => {
			console.error("Error fetching photos:", error)
			cb(error)
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
					9780465007806: "https://images.gr-assets.com/books/1389237768l/33279.jpg",
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
