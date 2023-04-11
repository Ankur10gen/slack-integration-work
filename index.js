const { App } = require("@slack/bolt");
const { writeToDB, findFromDB, searchDB } = require("./db");
require("dotenv").config();

// Slack App Secrets
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

// Listen for users opening the App Home
app.event("app_home_opened", async ({ event, client, logger }) => {
  try {
    // Call views.publish with the built-in client
    const result = await client.views.publish({
      // Use the user ID associated with the event
      user_id: event.user,
      view: {
        type: "home",
        blocks: [
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "*What would you like your colleagues to read?*",
              },
            ],
          },
          {
            type: "input",
            element: {
              type: "plain_text_input",
              action_id: "link_input",
            },
            label: {
              type: "plain_text",
              text: "Link",
              emoji: true,
            },
            block_id: "link_input",
          },
          {
            type: "input",
            element: {
              type: "plain_text_input",
              multiline: true,
              action_id: "summary_input",
            },
            label: {
              type: "plain_text",
              text: "Summary",
              emoji: true,
            },
            block_id: "summary_input",
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Submit",
                  emoji: true,
                },
                value: "click_me_123",
                action_id: "actionId-0",
              },
            ],
          },
        ],
      },
    });

    logger.info(result);
  } catch (error) {
    logger.error(error);
  }
});

// Listener function for button press - Uses action id for the button
app.action("actionId-0", async ({ body, client, ack }) => {
  await ack();
  console.log("Button was pressed");
  console.log(body.view.id, JSON.stringify(body.view.state));

  const link = body.view.state["values"]["link_input"]["link_input"]["value"];
  const summary =
    body.view.state["values"]["summary_input"]["summary_input"]["value"];
  const username = body.user.username;

  var data = JSON.stringify({
    collection: "activity",
    database: "slack",
    dataSource: "all-hands-dev",
    document: {
      link: link,
      summary: summary,
      username: username,
      createdAt: { $date: new Date(Date.now()).toISOString() },
    },
  });

  // Database call to write the data
  writeToDB(data);

  // Update view with success x
  const result = await client.views.update({
    view_id: body.view.id,
    view: {
      type: "home",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Submission Successful.",
            emoji: true,
          },
        },
      ],
    },
  });
});

// Command /readinglist gets the data for a specified user
// If no user is specified, then the data for the user invoking the command is received
app.command("/readinglist", async ({ command, ack, respond }) => {
  await ack();

  var data = {
    collection: "activity",
    database: "slack",
    dataSource: "all-hands-dev",
  };

  let text = command.text;

  console.log("text: ", text);

  // If no username then return data for the user calling the command
  if (text == "") {
    text = command.user_name;
  }

  // If username is tagged, it is expected with @
  if (text.charAt(0) == "@") {
    text = text.slice(1);
  }

  let beautifulMsgs = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Here are a few articles shared by* _" + text + "_ .",
        },
      },
    ],
  };

  // Filter the data for the username
  data["filter"] = { username: text };
  const res = await findFromDB(JSON.stringify(data));

  // Parse the query result into JSON to iterate over the documents
  const parseRes = JSON.parse(res)["documents"];
  console.log(parseRes[0], parseRes.length);
  if (parseRes.length == 0) {
    respond({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Sorry!* " + text + " *hasn't shared anything yet. Let them know about KnowledgeCorner.*",
          },
        },
      ],
    });
    return;
  }
  try {
    // Limiting results to 20 for demo
    for (var i = 0; i < 20; i++) {
      try {
        let bmsg = {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              i +
              1 +
              ". *" +
              parseRes[i]["summary"] +
              "* <" +
              parseRes[i]["link"] +
              "|" +
              "Read More Here>",
          },
        };
        console.log(bmsg);
        beautifulMsgs.blocks.push(bmsg);
      } catch (err) {
        console.log(err, parseRes[i]);
      }
    }
  } catch (err) {
    console.log(err);
  }
  respond(beautifulMsgs);
});

// Command to search on the Reading List with a keyword
app.command("/readinglistsearch", async ({ command, ack, respond }) => {
  await ack();

  let text = command.text;

  // Call the search endpoint
  const res = await searchDB(JSON.stringify(text));

  // Parse the result into JSON and iterate through it for display
  const parseRes = JSON.parse(res);

  // Return if no articles were found
  if (parseRes.length == 0) {
    respond({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "*Hmnn! looks like we don't have anything related to " +
              text +
              " yet. Be the first one to share something in this area. Check KnowledgeCorner > Home.*",
          },
        },
      ],
    });
    return;
  }

  let beautifulMsgs = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*These articles may be relevant to* _" + text + "_ .",
        },
      },
    ],
  };
  for (var i = 0; i < parseRes.length; i++) {
    try {
      let bmsg = {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            i +
            1 +
            ". *" +
            parseRes[i]["summary"] +
            "* <" +
            parseRes[i]["link"] +
            "|" +
            "Read More Here>",
        },
      };
      beautifulMsgs.blocks.push(bmsg);
    } catch (err) {
      console.log(err);
    }
  }
  console.log(beautifulMsgs);
  respond(beautifulMsgs);
});

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
