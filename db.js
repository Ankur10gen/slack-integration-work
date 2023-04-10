// This module interfaces with the backend database
var axios = require("axios");
require("dotenv").config();

// DB API key
const AtlasApiKey = process.env.ATLAS_API_KEY;

var config = {
  method: "post",
  url: "https://ap-southeast-1.aws.data.mongodb-api.com/app/data-nvdxf/endpoint/data/v1/action/insertOne",
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Request-Headers": "*",
    "api-key": AtlasApiKey,
  },
};

// Write the data to Atlas cluster
function writeToDB(data) {
  config["data"] = data;
  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
}

// Find the data from Atlas
async function findFromDB(data) {
  const customPromise = new Promise((resolve, reject) => {
    config["data"] = data;
    config["url"] =
      "https://ap-southeast-1.aws.data.mongodb-api.com/app/data-nvdxf/endpoint/data/v1/action/find";
    let res = "";
    axios(config)
      .then(function (response) {
        console.log("I was here");
        console.log(JSON.stringify(response.data));
        res = JSON.stringify(response.data);
        resolve(res);
      })
      .catch(function (error) {
        console.log("came here");
        console.log(error);
        reject(res);
      });
  });
  return customPromise;
}

// Search the data on Atlas
async function searchDB(searchString) {
  const customPromise = new Promise((resolve, reject) => {
    let cfg = {
      method: "post",
      url:
        "https://us-east-1.aws.data.mongodb-api.com/app/slack-backend-pzncy/endpoint/searchReadingLists?searchString=" +
        searchString,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios(cfg)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
        resolve(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
        reject("");
      });
  });
  return customPromise;
}

module.exports = { writeToDB, findFromDB, searchDB };
