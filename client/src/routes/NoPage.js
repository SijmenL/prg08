// routes/home.js
import React, {useEffect} from 'react';
import backgroundImage from "../assets/img/storm.png";

const NoPage = () => {

    useEffect(() => {
        const filter = document.getElementById('background');
        let visible = true;
        const onChange = (e) => {

            if (visible === true) {
                visible = false;
                filter.classList.add('hidden');
                filter.classList.remove('block');
            } else {
                visible = true;
                filter.classList.remove('hidden');
                filter.classList.add('block');
            }
        };

        document.addEventListener('visibilitychange', onChange);
    }, []);

    return (
        <div className="bg-black flex flex-col justify-center items-center">
            <img id="background" className="error-image" alt="background" src={backgroundImage}></img>
            <svg className="absolute">
                <filter id="wavy">
                    <feTurbulence id="turbulence" type="turbulence" numOctaves="1" result="NOISE"></feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="NOISE" scale="15"></feDisplacementMap>
                    <animate xlinkHref="#turbulence" attributeName="baseFrequency" dur="60s" keyTimes="0;0.5;1"
                             values="0.01 0.02;0.02 0.04;0.01 0.02" repeatCount="indefinite"></animate>
                </filter>
            </svg>

            <div className="absolute flex items-center flex-col backdrop-blur-2xl bg-black/[.4] p-3 rounded m-2">
                <p className="text-white">404 error</p>
                <h1 className="text-red-600 text-3xl font-bold">This page does not exist!</h1>
            </div>
        </div>
    );
};

export default NoPage;

