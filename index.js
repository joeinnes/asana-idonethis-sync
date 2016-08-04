/* Required modules */
var Asana = require('asana');
var util = require('util');
var request = require('request');
var config = require('./config.js');

/* Config items, pulled from ./config.js */
var AsanaClientId = config.asanaClientId;
var AsanaClientSecret = config.asanaClientSecret;
var iDoneThisTeam = config.iDoneThisTeam;
var iDoneThisToken = config.iDoneThisToken;

/* Asana stuff */
var client = Asana.Client.create({
  clientId: AsanaClientId,
  clientSecret: AsanaClientSecret
});

client.useOauth();

client.authorize().then(function () {

  /* The main work */
  function fetch() {

    var newTasks = 0;
    var oldTasks = 0;

    client.users.me()

      .then(function (user) {
        var userId = user.id;
        var workspaceId = user.workspaces[0].id; // Takes user's default workspace
        var TWO_HOURS = 2 * 60 * 60 * 1000;
        var twoHoursAgo = new Date(new Date() - TWO_HOURS);
        return client.tasks.findAll({
          assignee: userId,
          workspace: workspaceId,
          completed_since: twoHoursAgo,
          opt_fields: 'id,name,completed,projects.name,external',
          opt_expand: 'projects',
        });
      })

      .then(function (response) {
        return response.data;
      })

      .filter(function (task) {
        /* Don't include any tasks which made it through despite being incomplete */
        if (task.completed !== true) {
          return false;
        }

        /* Check to see if the task.external.data.passedToIDT property is set and truthy. Exclude if so */
        if (task.hasOwnProperty('external')) {
          if (task.external.hasOwnProperty('data')) {
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
            projectList.push('#' + project.name.split(' ').join('-'));
          });

          /* Send off the task to iDoneThis. */
          request.post({
            url: 'https://idonethis.com/api/v0.1/dones/',
            headers: {
              'Authorization': 'Token ' + iDoneThisToken
            },
            body: {
              "team": iDoneThisTeam,
              "raw_text": task.name + ' ' + projectList.join(' ')
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
                  'id': "idtsync" + task.id,
                  'data': JSON.stringify({
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
        console.log(newTasks + '/' + (newTasks + oldTasks) + ' tasks passed to iDoneThis.');
      });

    /* And do it all again in 120 seconds */
    setTimeout(fetch, 120000);
  }

  /* Now call the function for the first time */
  fetch();

})
.catch(function (err) {

  /* If there's a problem, report it */
  console.log('An error occurred', err);
});
