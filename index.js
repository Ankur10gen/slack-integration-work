const { App } = require('@slack/bolt');
const { writeToDB, findFromDB, searchDB } = require('./db')
require('dotenv').config()

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

/* Add functionality here */
app.message(':wave:', async ({ message, say }) => {
    await say(`Hello, <@${message.user}>`);
  });

// Listen for users opening your App Home
app.event('app_home_opened', async ({ event, client, logger }) => {
    try {
      // Call views.publish with the built-in client
      const result = await client.views.publish({
        // Use the user ID associated with the event
        user_id: event.user,
        view: {
            "type": "home",
            "blocks": [
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "*What would you like your colleagues to read?*"
                        }
                    ]
                },
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "link_input"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Link",
                        "emoji": true
                    },
                    "block_id":"link_input"
                },
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "multiline": true,
                        "action_id": "summary_input"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Summary",
                        "emoji": true
                    },
                    "block_id":"summary_input"
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Submit",
                                "emoji": true
                            },
                            "value": "click_me_123",
                            "action_id": "actionId-0"
                        }
                    ]
                }
            ]
        }
      });
  
      logger.info(result);
      //console.log(await client.users.info({user:event.user}))
    }
    catch (error) {
      logger.error(error);
    }
  });

// Your listener function will be called every time an interactive component with the action_id "approve_button" is triggered
app.action('actionId-0', async ({ body, client, ack }) => {
    await ack();
    console.log("Button was pressed")
    console.log(body.view.id, JSON.stringify(body.view.state))

    const link = body.view.state['values']['link_input']['link_input']['value']
    const summary = body.view.state['values']['summary_input']['summary_input']['value']
    const username = body.user.username

    var data = JSON.stringify({
        "collection": "activity",
        "database": "slack",
        "dataSource": "all-hands-dev",
        "document": {
            "link": link,
            "summary": summary,
            "username": username,
            "createdAt":{ "$date": new Date(Date.now()).toISOString() }
          }
    })

    writeToDB(data);
    
     const result = await client.views.update({
        // Use the user ID associated with the event
        view_id:body.view.id,
        view: {
            "type": "home",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "Submission Successful.",
                        "emoji": true
                    }
                }]}});

});

app.command('/readinglist', async ({ command, ack, respond }) => {
    // Acknowledge command request
    await ack();
  
    //await respond(JSON.stringify(command.text));

    var data = {
        "collection": "activity",
        "database": "slack",
        "dataSource": "all-hands-dev"
    }

    let text = command.text

    console.log("text: ", text)

    if(text == ""){
        text = command.user_name
    }

    if(text.charAt(0) == "@") {
        text = text.slice(1,)
    }

    let beautifulMsgs = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*These articles may be relevant to* _" + text + "_ ."
                }
            }
        ]
    }

    data["filter"] = {"username": text}
    const res = await findFromDB(JSON.stringify(data))
    const parseRes = JSON.parse(res)["documents"]
    console.log(parseRes[0], parseRes.length)
    try{
        for(var i=0;i<20;i++){
            try {
            let bmsg = {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": i+1+". *"+parseRes[i]['summary']+"* <"+parseRes[i]['link']+"|"+"Read More Here>"
                }
            }
            console.log(bmsg)
            beautifulMsgs.blocks.push(bmsg)
        } catch(err) {
            console.log(err, parseRes[i])
        }
        }
    }
    catch(err){
        console.log(err)
    }
    respond(beautifulMsgs)
  });

  // Search on Reading List
  app.command('/readinglistsearch', async ({ command, ack, respond }) => {
    // Acknowledge command request
    await ack();
  
    let text = command.text
    const res = await searchDB(JSON.stringify(text))
    const parseRes = JSON.parse(res)
    let beautifulMsgs = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*These articles may be relevant to* _" + text + "_ ."
                }
            }
        ]
    }
    for(var i=0;i<parseRes.length;i++){
        try {
        let bmsg = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": i+1+". *"+parseRes[i]['summary']+"* <"+parseRes[i]['link']+"|"+"Read More Here>"
			}
		}
        beautifulMsgs.blocks.push(bmsg)
    } catch(err) {
        console.log(err)
    }
    }
    console.log(beautifulMsgs)
    respond(beautifulMsgs)
  });

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();