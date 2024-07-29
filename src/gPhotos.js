const fs = require("fs")
const path = require("path")
const axios = require("axios")
const _ = require("lodash")
const { google } = require("googleapis")
const dotenv = require("dotenv")
dotenv.config()

async function getGoogleAccessToken() {
	const oauth2Client = new google.auth.OAuth2(
		process.env.G_PHOTOS_CLIENT_ID,
		process.env.G_PHOTOS_CLIENT_SECRET,
		"urn:ietf:wg:oauth:2.0:oob",
	)

	oauth2Client.setCredentials({
		refresh_token: process.env.G_PHOTOS_REFRESH_TOKEN,
	})

	// const { token } = await oauth2Client.getAccessToken()
	// return token
	try {
		const accessTokenResponse = await oauth2Client.getAccessToken()
		return accessTokenResponse.token
	} catch (error) {
		console.error("Error refreshing access token:")
		// Handle invalid refresh token error
		if (
			error.response &&
			error.response.data &&
			error.response.data.error === "invalid_grant"
		) {
			console.error("Refresh token has expired or is invalid.")
		}
		throw error
	}
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

async function downloadImage(url, filepath) {
	const writer = fs.createWriteStream(filepath)
	const response = await axios({
		url,
		method: "GET",
		responseType: "stream",
	})

	response.data.pipe(writer)

	return new Promise((resolve, reject) => {
		writer.on("finish", resolve)
		writer.on("error", reject)
	})
}

async function savePhotos() {
	try {
		const outputDir = path.join(__dirname, "..", "dist", "assets", "photos")

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir)
		}
		// const photos = await listAlbumPhotos(albumId);
		const photos = await listGooglePhotosFavorites()
		const photoData = []
		if (photos && photos.length > 0) {
			for (let i = 0; i < photos.length; i++) {
				const photo = photos[i]
				const url = `${photo.baseUrl}=w1000-h1000-d` // `-d` parameter to download the image
				const filepath = path.join(outputDir, `photo${i + 1}.jpg`)
				await downloadImage(url, filepath)
				console.log(`Downloaded ${photo.filename} to ${filepath}`)
				photoData.push({
					filename: photo.filename,
					path: path.join("assets", "photos", path.basename(filepath)),
					description: photo.description,
				})
			}
		} else {
			console.log("No photos found.")
		}

		// Convert JSON object to string
		const jsonString = JSON.stringify({ photos: photoData }, null, 2)

		// Write JSON string to a file
		const jsonFilename = "photos.json"
		fs.writeFile(path.join(outputDir, jsonFilename), jsonString, (err) => {
			if (err) {
				console.log("Error writing file", err)
			} else {
				console.log(`Successfully wrote ${jsonFilename}`)
			}
		})
		return photoData
	} catch (error) {
		console.error("Error fetching photos:", error)
	}
}

const compileGooglePhotosData = function () {
	savePhotos()
		.then((photos) => {
			console.log("RESPONSE: G_PHOTOS", photos.length)
			console.log(photos)
		})
		.catch((error) => {
			console.error("Error fetching photos:", error)
		})
}

compileGooglePhotosData()
