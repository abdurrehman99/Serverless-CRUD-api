"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  accessKeyId: "xxxx",
  secretAccessKey: "xxxx",
  region: "localhost",
  endpoint: "http://localhost:8000 ",
}); //remove when deployoing

module.exports.create = async (event, context, callback) => {
  try {
    const { name, email } = JSON.parse(event.body);
    console.log(" body==> ", name, email);
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        id: uuid.v1(),
        name,
        email,
      },
    };
    dynamoDB.put(params, (e) => {
      if (e) {
        handleError(e, "Fail to create new User", callback);
      }
      const response = {
        statusCode: 200,
        body: JSON.stringify(params.Item),
      };
      console.log("response", response);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(response, null, 2),
      };
      // callback(null,response)
    });
  } catch (error) {
    console.log("error", error);
  }
};

module.exports.getAll = async (event, context, callback) => {
  let params = {
    TableName: process.env.DYNAMODB_TABLE,
  };
  // try {
  //   const result = await dynamoDB.scan(params);
  //   callback(null,{
  //     statusCode: 201,
  //     body: JSON.stringify(result.Items)
  //   });
  // } catch (error) {
  //   console.error(error);
  //   handleError(e, " Fail to fetch users", callback);
  // }
  dynamoDB.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      handleError(e, " Fail to fetch users", callback);
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
    callback(null, response);
  });
};

module.exports.update = async (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
    const id = event.pathParameters.id;
    const params = {
        TableName: process.env.DYNAMODB_TABLE, // table name
        Key: {
            id
        },
        ExpressionAttributeValues: {
            ':name': requestBody.name,
            ':email': requestBody.email,
        },
        UpdateExpression: "SET name = :name, email = :email,",
        ReturnValues: 'ALL_NEW' // get all new values from the database
    };
    dynamoDB.update(params, (error, result) => {
        if (error) {
            handleError(error, 'Failed to Update the User', callback);
        }
        const response = {
            statusCode: 200,
            body: JSON.stringify(result)
        };
        callback(null, response);
    })
};

module.exports.delete = async (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
      TableName: process.env.DYNAMODB_TABLE, // table name
      Key: {
          id
      }
  };
  dynamoDB.delete(params, (error) => {
      if (error) {
          handleError(error, 'Failed to Delete the User', callback)
      }
      const response = {
          statusCode: 200,
          body: JSON.stringify(`User ${id} removed from DB`)
      };
      callback(null, response);
  });
};




// Handler that handles the error, occured during insert, read, update, delete
const handleError = (error, errorMsg, callback) => {
  console.error(error);
  return callback(null, {
    statusCode: error.statusCode || 500,
    headers: { "Content-Type": "text/plain" },
    body: errorMsg,
  });
};
