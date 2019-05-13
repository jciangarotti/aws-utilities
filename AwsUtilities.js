const AWS       = require("aws-sdk");
const pug       = require('pug');
const qencode   = require('q-encoding');
const utf8      = require('utf8');
var MIME        = (string) => '=?UTF-8?Q?' + qencode.encode(utf8.encode(string)) + '?=';


class AwsUtilities {
    /**
     *  If you have two or more profile in your environment you can choose and setup to use in this function. 
     * @param {*} parameters { region, profile }
     */
    constructor(parameters){
        const region    = parameters.region;
        const profile   = parameters.profile;
        this.ses        = new AWS.SES({region});
        // this.lambda     = new AWS.Lambda({region});
        // this.s3         = new AWS.S3({
        //     apiVersion: '2006-03-01'
        // });
        this.sns        = new AWS.SNS({
            apiVersion: '2010-03-31'
        });
        AWS.config.update(parameters);
        this.ddb        = new AWS.DynamoDB.DocumentClient();

        if(profile){
            //To configurate and force the local profile profile.
            this.credentials = new AWS.SharedIniFileCredentials({profile: profile});
            AWS.config.credentials = this.credentials;
        }


    }

    sendSesMail (data, pugFileUrl, name, sourceMail) {
        const senderSource = `${MIME(name)} <${sourceMail}>`;
        return new Promise((resolve, reject) => {
            let html = pug.renderFile(__dirname + pugFileUrl, {
                'nombreComercio': data.nombreComercio,
                'mensaje': data.mensaje,
                'urlPago': data.url
            });

            let params  = {
                Destination: {
                    BccAddresses: [],
                    CcAddresses: [],
                    ToAddresses: [
                        data.email,
                    ]
                },
                Message: {
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data:   html
                        },
                    },
                    Subject: {
                        Charset: "UTF-8",
                        Data: "Haz recibido un cobro" 
                    }
                },
                Source: senderSource,
            };

            console.log("Email Params: ", params);

            this.ses.sendEmail(params, function (err, data) {
                if (err) {
                    console.log("ERROR Sending the email in SES", err);
                     // context.fail(err);
                    return reject(err);
                } // an error occurred
                else {
                    console.log("The email was succesfully sent", data)
                    // context.succeed(event);
                    return resolve(data);
                }; // successful response
    
            });

        });
    };

    publishToSNS (mensaje, TopicArn) {
        const params = {
           Message: JSON.stringify(mensaje),
           TopicArn
        };

        // Create promise and SNS service object
        var publishTextPromise = sns.publish(params).promise();
        // handle promise's fulfilled/rejected states
        publishTextPromise
            .then((data) => {
            // console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
            // console.log(params.Message);
            console.log("MessageID is " + data.MessageId);
        }).catch((err) => {
            console.error(err, err.stack);
        });       
       
    };

    /**
     * This function excecute the query to get the info.
     * @param {*} params 
     */
    executeDdbQuery(params) {
        return new Promise((resolve, reject) => {
            this.ddb.query(params, function (err, data) {
                if (err) {
                    console.log("Error", err);
                    reject(err);
                } else {
                    console.log(data);
                    resolve(data);
                }
            });
        });
    }

    /**
     * This function put all the items parameters into the dynamo DB.
     * @param {*} params 
     */
    executePutQuery(params) {
        console.log("INGRESANDO A FUNCIÓN EXECUTEQUERY");
        console.log(params);
        return new Promise((resolve, reject) => {


           // Call DynamoDB to add the item to the table
            this.ddb.put(params, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err)
                } else {
                    // console.log("Success", data);
                    resolve(data);
                }
            });
        });
    }





}

module.exports  = AwsUtilities;