// routes/home.js
import React, {useEffect, useRef, useState} from 'react';
import loadingImage from "../assets/img/loading.gif";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import customMarkerIcon from '../assets/img/map-marker-icon.png';
import logo from '../assets/img/logo.png';

const Home = () => {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [coordinates, setCoordinates] = useState({lat: 0, lng: 0});
    const [vesselInformation, setBoatInformation] = useState('');
    const [tripInformation, setTripInformation] = useState('');
    const [userQuestion, setMessage] = useState('');
    const [messageBoard, setMessageBoard] = useState('')
    const [responses, setResponses] = useState('')
    const [chatID, setChatID] = useState('')
    const [sideBar, setSideBar] = useState([])
    const [isLoading, setIsLoading] = useState(false);
    const chatWindowRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) {
            handleMap()
        }
        getLocalStorageKeysByPrefix()
    }, []);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTo(0, chatWindowRef.current.scrollHeight);
        }
    }, [responses]);

    const getLocalStorageKeysByPrefix = () => {
        const prefix = 'BoatBotChat';
        const keys = Object.keys(localStorage);

        const boatBotChatKeys = keys.filter((key) => key.startsWith(prefix));
        setSideBar(boatBotChatKeys)

        console.log(sideBar)
    };


    const loadPreviousChat = (id) => {
        const savedChatHistory = JSON.parse(localStorage.getItem(id));

        if (savedChatHistory) {
            setResponses(savedChatHistory.responses);
            setMessageBoard(savedChatHistory.messageBoard);
            setChatID(id)
        }

        console.log(savedChatHistory)
    }

    const handleMap = async () => {
        const map = L.map('map').setView([51.7855530987646, 4.455446225419464], 10);

        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }
        ).addTo(map);

        map.on('click', function (e) {
            const {lat, lng} = e.latlng;
            console.log(`Latitude: ${lat}, Longitude: ${lng}`);

            if (markerRef.current) {
                markerRef.current.remove();
            }

            const customIcon = L.icon({
                iconUrl: customMarkerIcon,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            });

            const marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
            markerRef.current = marker;

            setCoordinates({lat, lng});
        });

        mapRef.current = map;
    }

    const handleGenerateAdvice = async () => {
        setIsLoading(true);
        const requestData = {
            vesselInformation,
            tripInformation,
            lon: coordinates.lng,
            lat: coordinates.lat,
        };

        try {
            const response = await fetch('http://145.24.222.58:8000/advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Response from backend:', responseData);

            setMessageBoard(responseData);

            setBoatInformation('');
            setTripInformation('');
            setCoordinates({lat: 0, lng: 0});

            const timestamp = Date.now();
            const title = responseData.title || 'NoTitle';

            const chatID = `BoatBotChat_${timestamp}_${title}`;
            setChatID(chatID);

            const combinedData = {
                messageBoard: responseData,
                responses: '',
            };
            localStorage.setItem(chatID, JSON.stringify(combinedData));

            // Remove the existing marker on the map
            if (markerRef.current) {
                markerRef.current.remove();
            }
        } catch (error) {
            console.error('Error:', error.userQuestion);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMessageSend = async () => {
        setIsLoading(true);

        setResponses(prevResponses => {
            const newResponses = [...prevResponses, { message: userQuestion }];
            setLocalStorageData(newResponses); // Save to local storage
            return newResponses;
        });

        setMessage('');

        const requestData = {
            previousMessages: responses,
            userQuestion: userQuestion,
            weatherInformation: messageBoard.weatherdata,
            adviseInformation: messageBoard.advice
        };

        try {
            const response = await fetch('http://145.24.222.58:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Response from backend:', responseData);


            setResponses(prevResponses => {
                const newResponses = [...prevResponses, responseData];
                setLocalStorageData(newResponses); // Save to local storage
                return newResponses;
            });

            setMessage('');

        } catch (error) {
            console.error('Error:', error.userQuestion);
        } finally {
            setIsLoading(false);
        }
    };

    const setLocalStorageData = (responses) => {
        const combinedData = {
            messageBoard: messageBoard,
            responses: responses,
        };
        localStorage.setItem(chatID, JSON.stringify(combinedData));
    };

    const newPrompt = async () => {
        window.location.reload();
    }

    return (
        <div className="bg-black flex flex-row home-image h-full max-w-full">
            <div className="backdrop-blur-2xl sidebar bg-black/[.4] p-3 flex flex-col items-center p-2">
                <img src={logo} className="w-1/2" alt="logo"></img>
                <h1 className="text-white text-xl font-bold">BoatBot</h1>
                <button
                    type="button"
                    onClick={newPrompt}
                    className="mt-4 rounded bg-blue-900 hover:bg-blue-700 py-2 px-4 text-white flex flex-row align-middle"
                >
                    New advice
                </button>

                <div className="flex flex-col gap-4 mt-5 button-display">
                    {Array.isArray(sideBar) &&
                        sideBar.map((chatId) => {
                            const [, timestamp, title] = chatId.split('_');

                            return (
                                <button key={chatId} onClick={() => loadPreviousChat(chatId)} className="text-white bg-black/[.4] hover:bg-black/[.6] rounded p-1">
                                    <span>{title}</span>
                                </button>
                            );
                        })}
                </div>
            </div>

            <div className="mt-5 flex items-center flex-col content">
                {!messageBoard ? (
                    <h1 className="text-white text-3xl font-bold">The BoatBot</h1>
                ) : (
                    <h1 className="text-white text-3xl font-bold">{messageBoard.title}</h1>
                )}
                <div
                    className="backdrop-blur-2xl bg-black/[.4] p-3 rounded m-2 lg:w-1/2 flex items-center justify-center flex-col">
                    {!messageBoard && (
                        <>
                            <h2 className="text-white text-2xl font-bold">Enter your Trip Details</h2>
                            <p className="text-white">Provide the specifics of your vessel and the general area of your
                                trip. We will generate advice based on the information you give us, which you can ask
                                questions on.</p>
                            <form className="mt-4">
                                <div className="mt-2">
                                    <label htmlFor="vesselInformation" className="mt-4 text-white">
                                        Describe your boat
                                        <small className="text-white ml-3">
                                            <b>For example: </b>A 9 meter long sailboat made of polyester
                                        </small>
                                    </label>
                                    <input
                                        id="vesselInformation"
                                        required
                                        value={vesselInformation}
                                        onChange={(e) => setBoatInformation(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="Boat Specifics"
                                    />
                                </div>

                                <div className="mt-2">
                                    <label htmlFor="tripInformation" className="mt-4 text-white">
                                        Provide additional information
                                        <small className="text-white ml-3">
                                            <b>For example: </b>I am going with my 15 year old inexperienced sister
                                        </small>
                                    </label>
                                    <input
                                        id="tripInformation"
                                        value={tripInformation}
                                        onChange={(e) => setTripInformation(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="Additional information"
                                    />
                                </div>

                                <div className="mt-2">
                                    <p className="text-white">Provide the general location of your trip</p>
                                    <div className="h-60 w-60" id="map"></div>
                                </div>

                                <div className="hidden">
                                    <input
                                        id="latitude"
                                        value={coordinates.lat}
                                        readOnly
                                        className="mt-1 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                    <input
                                        id="longitude"
                                        value={coordinates.lng}
                                        readOnly
                                        className="mt-1 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGenerateAdvice}
                                    className="mt-4 rounded bg-blue-900 hover:bg-blue-700 py-2 px-4 text-white flex flex-row align-middle"
                                    disabled={isLoading} // Disable the button while loading
                                >
                                    {isLoading ? (
                                        <>
                                            <span
                                                className="material-symbols-outlined mr-1 rotating">progress_activity</span>
                                            Generating....
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined mr-1">prompt_suggestion</span>
                                            Generate advice!
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {messageBoard && (
                        <>
                            <div className=" flex flex-row items-center">
                                <div className="bg-white text-black rounded p-2 w-2/3">
                                    <p>{messageBoard.advice}</p>
                                </div>
                                <div className="text-white p-2 flex flex-col items-center">
                                    {messageBoard.weatherdata && (
                                        <>
                                            <h1 className="font-bold text-xl">Weather
                                                in {messageBoard.weatherdata.name}</h1>
                                            <div className="flex flex-row gap-1 mt-2">
                                                <div
                                                    className="bg-black/[0.2] rounded p-1 flex items-center flex-col justify-center w-20 text-center">
                                                    <img
                                                        src={`https://openweathermap.org/img/wn/${messageBoard.weatherdata.weather[0].icon}@2x.png`}
                                                        alt="Weather Icon"
                                                    />
                                                    <p>{messageBoard.weatherdata.weather[0].main}</p>
                                                </div>

                                                <div
                                                    className="bg-black/[0.2] rounded p-1 flex items-center flex-col justify-center w-20 text-center">
                                                    <div className="wind-direction m-4">
                                                        <div
                                                            className="wind-arrow"
                                                            style={{
                                                                transform: `rotate(${parseFloat(
                                                                    messageBoard.weatherdata.wind.deg
                                                                )}deg)`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <p>
                                                        {Number(messageBoard.weatherdata.wind.speed * 1.94384).toFixed(1)} knots
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="flex flex-row gap-1 items-center">
                                                    <span
                                                        className="material-symbols-outlined mr-1">device_thermostat</span>
                                                    Temperature: {Number(messageBoard.weatherdata.main.temp - 273.15).toFixed(1)} &deg;C
                                                </p>
                                                <p className="flex flex-row gap-1 items-center">
                                                    <span className="material-symbols-outlined mr-1">thermometer</span>
                                                    Feels
                                                    like: {Number(messageBoard.weatherdata.main.feels_like - 273.15).toFixed(1)} &deg;C
                                                </p>
                                                {messageBoard.weatherdata.wind.gust !== undefined && (
                                                    <p className="flex flex-row gap-1 items-center text-red-300 font-bold">
                                                        <span className="material-symbols-outlined mr-1">airwave</span>
                                                        Wind
                                                        gusts: {Number(messageBoard.weatherdata.wind.gust * 1.94384).toFixed(1)} knots
                                                    </p>
                                                )}
                                                <p className="flex flex-row gap-1 items-center">
                                                    <span className="material-symbols-outlined mr-1">air</span>
                                                    Wind
                                                    speed: {Number(messageBoard.weatherdata.wind.speed * 1.94384).toFixed(1)} knots
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {!messageBoard.weatherdata && (
                                        <>
                                            <h1 className="font-bold text-xl">No weather information available.</h1>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className=" mt-5 p-4 bg-black/[0.5] rounded w-full">

                                <div className="flex flex-col gap-4 chat-window p-3" ref={chatWindowRef}>
                                    {Array.isArray(responses) &&
                                        responses.map((response, index) => (
                                            <React.Fragment key={index}>
                                                {index % 2 === 0 ? (
                                                    <div className="odd-message bg-blue-200 p-3 rounded text-right">
                                                        <h3 className="font-bold text-xl">You</h3>
                                                        <div className="">{response.message}</div>
                                                    </div>
                                                ) : (
                                                    <div className="odd-message bg-gray-900 text-white p-3 rounded">
                                                        <h3 className="font-bold text-xl">BoatBot</h3>
                                                        <div className="">{response.message}</div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                </div>


                                <label htmlFor="chatBox" className="mt-4 text-white">
                                    Send a message about {messageBoard.title}
                                </label>
                                <small className="text-white ml-2">BoatBot can make mistakes</small>

                                <div className="flex flex-row gap-1 items-center justify-center mt-4">
                                    {isLoading ? (
                                    <input
                                        id="chatBox" disabled onChange={(e) => setMessage(e.target.value)}
                                        className="h-10 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="Ask BoatBot a question" value={userQuestion}
                                    />
                                    ) : (
                                        <input
                                            id="chatBox" onChange={(e) => setMessage(e.target.value)}
                                            className="h-10 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            placeholder="Ask BoatBot a question" value={userQuestion}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleMessageSend}
                                        className="w-30 h-10 rounded bg-blue-900 hover:bg-blue-700 py-2 px-4 text-white flex flex-row align-middle"
                                        disabled={isLoading} // Disable the button while loading
                                    >
                                        {isLoading ? (
                                            <>
                                                <span
                                                    className="material-symbols-outlined mr-1 rotating">progress_activity</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined mr-1">send</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </>
                    )}

                </div>
            </div>

        </div>
    );
};

export default Home;
