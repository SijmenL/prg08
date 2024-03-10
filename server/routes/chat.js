import express from "express";

const router = express.Router();
import {ChatOpenAI} from "@langchain/openai";
import {check, validationResult} from "express-validator";

import dotenv from "dotenv";

dotenv.config();

router.post('/', [check('message').notEmpty().withMessage('Message is required'),], async (req, res) => {
    const acceptHeader = req.get('Accept');
    const typeHeader = req.get('Content-Type');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const previousMessages = req.body.previousMessages;
    const userQuestion = req.body.userQuestion;
    const weatherInformation = req.body.weatherInformation;
    const adviseInformation = req.body.adviseInformation;

    const promptTemplate = `You are a bot that gives advice on a boating trip. Your name is BoatBot.
        
        You already gave the user advice based on some variables, now the user is chatting with you.
        I will provide the previous messages of the conversation, so you know what is going on. The first message is the advice you gave.
        
        
        You will respond to the users question or remark based on:
        - Your original advise to refer back to if needed: {adviseInformation}
        - Previous messages in an array: {previousMessages}
        - The new question or remark: {userQuestion}
        - The weather and location in a JSON format: {weatherInformation}
        
        Quick summary:
        1. You are a bot providing advice on boating trips.
2. Use the information provided about the previous message and the weather.
3. Note that the weather data includes wind speed in m/s, which should be converted to knots and temperatures in degrees Kelvin, which should be converted to Celsius.
5. Provide a short and easy-to-understand answer.
6. You only respond in the one json format, you don't invent user messages.
7. Do not give a chat history.
8. The user already knows the weather, as it is displayed on the page, so don't rub it in.
9. Keep your original advise in mind and refer to it where possible.
10. You can only use the weather at the location in the JSON, you can not make up weather data for place you don't have data for.
10. Write your answer in the following correct JSON format (only ever respond in this JSON format, don't give advice outside of the JSON):

{
  "message": "Your answer to the users message"
}
        `;

    const prompt = promptTemplate
        .replace("{previousMessages}", JSON.stringify(previousMessages))
        .replace("{userQuestion}", userQuestion)
        .replace("{weatherInformation}", JSON.stringify(weatherInformation))
        .replace("{adviseInformation}", JSON.stringify(adviseInformation));


    console.log(prompt)

    if (acceptHeader && acceptHeader.includes('application/json') && (typeHeader.includes('application/json') || typeHeader.includes('application/x-www-form-urlencoded'))) {
        try {
            const model = new ChatOpenAI({
                azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
                azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
                azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
                azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
            });

            const message = await model.invoke(prompt);
            console.log(message.content);

            let JSONmessage;

            try {
                JSONmessage = JSON.parse(message.content);

                console.log(JSONmessage)

                res.json(JSONmessage);

            } catch (error) {
                console.log(error)
                res.json({
                    message: "There was an error generating this response.",
                });

            }
        } catch (error) {
            console.error(error);
            res.status(500).json({message: "Internal server error"});
        }
    } else {
        res.status(406).json({message: 'Unsupported format. This endpoint only supports application/json'});
    }

});

export default router;
