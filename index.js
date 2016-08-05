/* eslint no-console: 0 */
/* eslint camelcase: ["error", {properties: "never"}] */

/* Required modules */
var Asana = require("asana");
var util = require("util");
var request = require("request");
var readline = require("readline");
var config = require("./config.js");

/* Config items, pulled from ./config.js */
var AsanaClientId = config.asanaClientId;
var AsanaClientSecret = config.asanaClientSecret;
var AsanaRedirectUri = config.asanaRedirectUri;
var AsanaRefreshToken = config.asanaRefreshToken;
var iDoneThisTeam = config.iDoneThisTeam;
var iDoneThisToken = config.iDoneThisToken;

var accessToken;
var accessTokenValidTo;

/* Asana stuff */
function createClient() {
  var client = Asana.Client.create({
    clientId: AsanaClientId,
    clientSecret: AsanaClientSecret,
    redirectUri: AsanaRedirectUri
  });

  return client;
}

function getAccessToken(client) {
  if (accessTokenValidTo > new Date()) {
    console.log("No need for a new token, old one still valid.");
    syncTasks(client);
    return;
  }
  return client.app.accessTokenFromRefreshToken(AsanaRefreshToken)
    .then(function (creds) {
      accessToken = creds.access_token;
      accessTokenValidTo = new Date();
      accessTokenValidTo.setSeconds(accessTokenValidTo.getSeconds() + creds.expires_in - 120);
      syncTasks(client);
    })
    .catch(function (err) {
      console.log(
        "Doesn\'t look like your refresh token is good, let\'s get a new one."
      );
      console.log("You should go to " + client.app.asanaAuthorizeUrl() +
        " and copy the code there");
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("What was the code?\n\nCode: ", function (code) {
        client.app.accessTokenFromCode(code)
          .then(function (credentials) {
            console.log(
              "Copy the following refresh token into your config file, and then restart this application:\n\n" +
              credentials.refresh_token);
            process.exit(0);
          });
      });
    });
}

function main() {
  var client = createClient();
  getAccessToken(client);
}

function syncTasks(client) {
  client.useOauth({
    credentials: accessToken
  });
  var newTasks = 0;
  var oldTasks = 0;

  client.users.me()
    .then(function (user) {
      var userId = user.id;
      var workspaceId = user.workspaces[0].id; // Takes user"s default workspace
      var TWO_HOURS = 4 * 60 * 60 * 1000;
      var twoHoursAgo = new Date(new Date() - TWO_HOURS);
      return client.tasks.findAll({
        assignee: userId,
        workspace: workspaceId,
        completed_since: twoHoursAgo,
        opt_fields: "id,name,completed,projects.name,external",
        opt_expand: "projects",
      });
    })

    .then(function (response) {
      return response.data;
    })

    .filter(function (task) {
      /* Don"t include any tasks which made it through despite being incomplete */
      if (task.completed !== true) {
        return false;
      }

      /* Check to see if the task.external.data.passedToIDT property is set and truthy. Exclude if so */
      if (task.hasOwnProperty("external")) {
        if (task.external.hasOwnProperty("data")) {
          var dataObj = JSON.parse(task.external.data);
          if (dataObj.passedToIDT) {
            oldTasks++;
            return false;
          }
        }
      }

      newTasks++;
      return true;
    })

    .then(function (tasks) {
      tasks.forEach(function (task) {
        /* Build a list of projects to add as tags in IDT */
        var projectList = [];
        task.projects.forEach(function (project) {
          projectList.push("#" + project.name.split(" ")
            .join("-"));
        });

        /* Send off the task to iDoneThis. */
        request.post({
          url: "https://idonethis.com/api/v0.1/dones/",
          headers: {
            "Authorization": "Token " + iDoneThisToken
          },
          body: {
            "team": iDoneThisTeam,
            "raw_text": task.name + " " + projectList.join(
              " ")
          },
          json: true,
        }, function (error, response, body) {

          /* Print the error, if there is one */
          if (error) {
            console.log(JSON.stringify(response, null, 2));
          } else {

            /* Otherwise, update this task in Asana */
            var data = {
              external: {
                "id": "idtsync" + task.id,
                "data": JSON.stringify({
                  "passedToIDT": true,
                })
              }
            };

            client.tasks.update(task.id, data)
              .catch(function (err) {

                /* Report any errors */
                console.log(JSON.stringify(err, null, 2));
              });
          }
        });
      });
      return tasks;
    })

    .then(function (tasks) {

      /* Finally, write out what happened to each of these tasks */
      console.log(newTasks + "/" + (newTasks + oldTasks) +
        " tasks passed to iDoneThis.");
    })

    .catch(function (err) {
      console.log(JSON.stringify(err, null, 2));
    });
}

setInterval(main, 120000);
main();