const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const { CognitoIdentityServiceProvider } = require('aws-sdk');
require('dotenv').config();

const app = express();
const port = 3001;

// Middlewares
app.use(bodyParser.json());

// AWS SDK Configuration
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();

// Route to authenticate using Cognito and list S3 objects
app.post('/listS3Objects', async (req, res) => {
  const { idToken } = req.body;

  try {
    // Get AWS credentials from Cognito Identity Pool
    const cognitoIdentity = new AWS.CognitoIdentity();

    const params = {
      IdentityPoolId: process.env.IDENTITY_POOL_ID,
      Logins: {
        [`cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}`]: idToken,
      },
    };

    // Get credentials
    const identity = await cognitoIdentity.getId(params).promise();
    const credentials = await cognitoIdentity.getCredentialsForIdentity({
      IdentityId: identity.IdentityId,
      Logins: {
        [`cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.USER_POOL_ID}`]: idToken,
      },
    }).promise();

    // Use these credentials to interact with S3
    AWS.config.credentials = new AWS.Credentials(credentials.Credentials);

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
    };

    // List objects in S3 bucket
    s3.listObjectsV2(s3Params, (err, data) => {
      if (err) {
        console.log("Error listing S3 objects", err);
        return res.status(500).send("Error listing objects");
      }
      return res.status(200).json(data.Contents);
    });
  } catch (error) {
    console.error("Error in authentication or S3 access", error);
    return res.status(500).send("Authentication or S3 error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
