const { App } = require('@slack/bolt');
const { writeToDB } = require('./db')

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
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "New request",
                        "emoji": true
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Type:*\nPaid Time Off"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Created by:*\n<example.com|Fred Enriquez>"
                        }
                    ]
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*When:*\nAug 10 - Aug 13"
                        }
                    ]
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Approve"
                            },
                            "style": "primary",
                            "value": "click_me_123",
                            "action_id": "actionId-0"
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Reject"
                            },
                            "style": "danger",
                            "value": "click_me_123"
                        }
                    ]
                }
            ]
        }
      });
  
      logger.info(result);
    }
    catch (error) {
      logger.error(error);
    }
  });

// Your listener function will be called every time an interactive component with the action_id "approve_button" is triggered
app.action('actionId-0', async ({ body, client, ack }) => {
    console.log("Button was pressed")
    await ack();
    
    var data = JSON.stringify({
        "collection": "activity",
        "database": "slack",
        "dataSource": "all-hands-dev",
        "document": {
            "status": "open",
            "text": "Do the dishes"
          }
    });

    await writeToDB(data)
    const result = await client.views.publish({
        // Use the user ID associated with the event
        user_id: body.user.id,
        view: {
            "type": "home",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "New request",
                        "emoji": true
                    }
                }]}});
    // Update the message to reflect the action
  });

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();