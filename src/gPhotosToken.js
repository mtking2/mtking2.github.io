const { google } = require("googleapis")
const readline = require("readline")
const dotenv = require("dotenv")
dotenv.config()

const CLIENT_ID = process.env.G_PHOTOS_CLIENT_ID
const CLIENT_SECRET = process.env.G_PHOTOS_CLIENT_SECRET
// const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob" // This is the out-of-band (OOB) redirect URI
const REDIRECT_URI = "https://mtking2.github.io"

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

// Generate an authorization URL
const authUrl = oauth2Client.generateAuthUrl({
	access_type: "offline", // Indicates that we need a refresh token
	scope: ["https://www.googleapis.com/auth/photoslibrary.readonly"],
})

console.log("Authorize this app by visiting this url:", authUrl)

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

rl.question("Enter the code from that page here: ", (code) => {
	rl.close()
	oauth2Client.getToken(code, (err, token) => {
		if (err) {
			return console.error("Error retrieving access token", err)
		}
		// oauth2Client.setCredentials(token)
		console.log(token)
		console.log("Access Token:", token.access_token)
		console.log("Refresh Token:", token.refresh_token)
	})
})
