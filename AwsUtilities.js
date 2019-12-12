const AWS = require('aws-sdk')

class AwsUtilities {
  /**
   *  If you have two or more profile in your environment you can choose and setup to use in this function.
   * @param {*} parameters { region, profile }
   */
  constructor (parameters) {
    const region = parameters.region
    this.ses = new AWS.SES({ region })
    AWS.config.update(parameters)
    this.ddb = new AWS.DynamoDB.DocumentClient()
  }

  /**
   * sendSESMailWTemplate is usefull if you have preconfigured templates in your AWS SES service. Return a promise with the AWS response. You can see more info in https://docs.aws.amazon.com/es_es/sdk-for-javascript/v2/developer-guide/ses-examples-sending-email.html
   * @param {*} data data contains the information to send the email and call the template.
   */
  sendSESMailWTemplate (data) {
    return new Promise((resolve, reject) => {
      // Create sendTemplatedEmail params
      var params = {
        Destination: { /* required */
          ToAddresses: [
            data.toAddress
          ]
        },
        Source: data.source, /* required */
        Template: data.templateName, /* required */
        TemplateData: data.templateData /* required */
      }
      console.log('Email Params: ', params)
      this.ses.sendTemplatedEmail(params, function (err, data) {
        if (err) {
          console.log('ERROR sending the email with sendTemplatedEmail function')
          return reject(err)
        } else {
          console.log('The email was succesfully sending with sendTemplatedEmail', data)
          return resolve(data)
        }
      })
    })
  }

  /**
   * Method to send a message to the sns arn
   * @param {*} message
   * @param {*} TopicArn
   */
  publishToSNS (message, TopicArn) {
    console.log('ENTERING TO PUBLISH SNS FUNCTION')
    const params = {
      Message: JSON.stringify(message),
      TopicArn
    }
    return new Promise((resolve, reject) => {
      // Create promise and SNS service object
      var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' })
        .publish(params)
        .promise()
      // handle promise's fulfilled/rejected states
      publishTextPromise
        .then((data) => {
          // console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
          // console.log(params.Message);
          console.log('MessageID is ' + data.MessageId)
          resolve(data)
        })
        .catch((err) => {
          console.log(err)
          reject(err)
        })
    })
  }

  /**
   * This function excecute the query to get the info.
   * @param {*} params
   */
  executeDdbQuery (params) {
    return new Promise((resolve, reject) => {
      this.ddb.query(params, function (err, data) {
        if (err) {
          console.log('ERROR', err)
          reject(err)
        } else {
          console.log(data)
          resolve(data)
        }
      })
    })
  }

  /**
   * This function put all the items parameters into the dynamo DB.
   * @param {*} params
   */
  executePutQuery (params) {
    console.log('INGRESANDO A FUNCIÓN EXECUTEQUERY')
    console.log(params)
    return new Promise((resolve, reject) => {
      // Call DynamoDB to add the item to the table
      this.ddb.put(params, function (err, data) {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          // console.log("Success", data);
          resolve(data)
        }
      })
    })
  }
  /**
   * To update the items in dynamoDB you can read the aws documentation to fill the params. 
   * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#updateItem-property
   * @param {*} params 
   */
  executeUpdateItems (params) {
    console.log('ENTERING TO UPDATE ITEMS FUNCTIONS')
    console.log(params)
    return new Promise((resolve, reject) => {
      this.ddb.updateItem(params, function (err, data) {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}
module.exports = AwsUtilities
