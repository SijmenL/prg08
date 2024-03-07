import express from "express";

const router = express.Router();
import {ChatOpenAI} from "@langchain/openai";
import {check, validationResult} from "express-validator";

import dotenv from "dotenv";

dotenv.config();

// **Fix 1: Pass user message as request body instead of template literal**
router.post('/', [
    check('message').notEmpty().withMessage('Message is required'),
], async (req, res) => {
    const acceptHeader = req.get('Accept');
    const typeHeader = req.get('Content-Type');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const vesselInformation = req.body.vesselInformation;
    const tripInformation = req.body.tripInformation;

    const apiKey = process.env.OPEN_WHEATER_MAP_API_KEY;

    const lat = req.body.lat;
    const lon = req.body.lon;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(async weatherData => {

            const weatherInformation = JSON.stringify(weatherData);

            console.log(weatherData)

            const promptTemplate =
                `You are a bot that gives advice on a boating trip. Your name is BoatBot.

You will provide advice based on the user's input:
- The user gives information about their vessel using vesselInformation.
- The user provides details about the general location of their trip using tripInformation.
- You receive precise weather data in JSON format using weatherInformation.

User input:
- Vessel details: {vesselInformation}
- Additional information about the trip: {tripInformation}
- Accurate weather data in JSON format: {weatherInformation}

Quick summary:
1. You are a bot providing advice on boating trips.
2. Use the information provided about the trip, additional details, and the weather.
3. Note that the weather data includes wind speed in m/s, which should be converted to knots and temperatures in degrees Kelvin, which should be converted to Celsius.
4. Provide a short and easy-to-understand recommendation.
5. If there is no user input, advice the user to give it instead of replying with random information.
6. Write your recommendation in the following JSON format (only ever respond in this JSON format, don't give advice outside of the JSON):

{
  "advice": "Your advice in at least 100 words",
  "title": "A title for the conversation based on the advice you gave, max 5 words"
}

        `;

            const prompt = promptTemplate
                .replace("{vesselInformation}", vesselInformation)
                .replace("{tripInformation}", tripInformation)
                .replace("{weatherInformation}", weatherInformation);


            console.log(prompt)

            if (acceptHeader && acceptHeader.includes('application/json') && (typeHeader.includes('application/json') || typeHeader.includes('application/x-www-form-urlencoded'))) {
                try {
                    const model = new ChatOpenAI({
                        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
                        azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
                        azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
                        azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
                    });

                    const advice = await model.invoke(prompt);
                    console.log(advice.content);

                    let JSONadvice;
                    try {
                        JSONadvice = JSON.parse(advice.content);
                        JSONadvice.weatherdata = weatherData;

                        res.json(JSONadvice);
                    } catch (error) {
                        res.json({
                            advice: "There was an error crafting your advice, try specifying more details about your trip.",
                            title: "Error :("
                        });

                    }
                } catch (error) {
                    // Handle potential errors during communication with OpenAI or model invocation
                    console.error(error);
                    res.status(500).json({message: "Internal server error"});
                }
            } else {
                // Send 406 Not Acceptable if client doesn't accept JSON
                res.status(406).json({message: 'Unsupported format. This endpoint only supports application/json'});
            }


        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });

});

export default router;
