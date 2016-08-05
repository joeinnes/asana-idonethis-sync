// Please complete, and copy to config.js

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\ 
 * You need to create an Asana app first:                                          *  
 * 1. Click on My Profile Settings -> Apps -> Manage Developer Apps                *
 * 2. Click + Add New Application                                                  *
 * 3. Choose an app name and url (these don"t matter)                              *
 * 4. Tick the box "This is a native or command-line app"                          *
 * 5. Copy the Redirect URL and paste it in the "asanaRedirectUri" section below   *
 *    (it will look like this: urn:ietf:wg:oauth:2.0:oob)                          *
 * 6. Choose to receive the newsletter or not, and accept the terms                *
 * 7. Copy and paste the client ID and client secret                               *
 * 8. Run the app, and you will be given a refresh token                           *
 * 9. You"re all set! Run the app again                                            *
\* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
 

var config = {
  "asanaClientId": "asana_client_id",
  "asanaClientSecret": "asana_client_secret",
  "asanaRedirectUri": "asana_redirect_uri",
  "asanaRefreshToken": "asana_refresh_token",
  "iDoneThisTeam": "idonethis_team", // This is the short name for your team. For example: https://idonethis.com/cal/team-name/
  "iDoneThisToken": "idonethis_token" // Get this here: https://idonethis.com/api/token/
};

module.exports = config;
