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
        username : name,
        email,
      },
    };
    const result = await dynamoDB.put(params).promise();
    let res = {
      message: "User Created",
    };
    return {
      statusCode: 200,
      body: JSON.stringify(res, null, 2),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      body: JSON.stringify(error.message, null, 2),
    };
  }
};

module.exports.getAll = async (event, context, callback) => {
  let params = {
    TableName: process.env.DYNAMODB_TABLE,
  };
  try {
    const result = await dynamoDB.scan(params).promise();
    console.log(result);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    });
  } catch (error) {
    console.error(error);
    handleError(error, " Fail to fetch users", callback);
  }
};

module.exports.getOne = async (event, context, callback) => {
  const {id} = event.pathParameters;
  let params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id
    },
  };
  try {
    const result = await dynamoDB.get(params).promise();
    if(result.Item){
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      });
    }
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({message : 'No user found of id '+id}),
    });
  } catch (error) {
    console.error(error);
    handleError(error, " Fail to fetch users", callback);
  }
};

module.exports.update = async (event, context, callback) => {
  const body = JSON.parse(event.body);
  const {id} = event.pathParameters;
  console.log('body',body)
  const params = {
    TableName: process.env.DYNAMODB_TABLE, // table name
    Key: {
      id
    },
    ExpressionAttributeValues: {
      ':username': body.name,
      ':email': body.email,
    },
    UpdateExpression: "SET username = :username, email = :email",
    ReturnValues: "UPDATED_NEW" // get all new values from the database
  };
  try {
    const result = await dynamoDB.update(params).promise();
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
    callback(null, response);
  } catch (error) {
    console.log('error',error)
    handleError(error, "Failed to Update the User", callback);
  }
};

module.exports.delete = async (event, context, callback) => {
  const {id} = event.pathParameters;
  const params = {
    TableName: process.env.DYNAMODB_TABLE, // table name
    Key: {
      id
    },
  };
  try {
    const result = await dynamoDB.delete(params).promise();
    console.log('result',result)
    if(result === {}){
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `User ${id} removed from DB`,
        }),
      });
    }
    else{
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: `User ${id} not found !`,
        }),
      });
    }
  } catch (error) {
    handleError(error, "Failed to Delete the User", callback);
  }
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
