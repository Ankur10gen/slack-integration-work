var axios = require('axios');
            
var config = {
    method: 'post',
    url: 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-nvdxf/endpoint/data/v1/action/insertOne',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': 'ZhmFkYB3hmmqiUQcrg2V5AbGLZ1KoV5VDP36XGyaGItlWsCukgkW9a4zBKaOaoOr',
    }
};
            
function writeToDB(data) {
    axios({config, data: data})
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
}

module.exports = {writeToDB}