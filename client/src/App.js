import './App.css';
import * as React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from './routes/Home';
import Layout from './routes/Layout';
import NoPage from './routes/NoPage';


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="*" element={<NoPage />} />
                </Route>
            </Routes>
        </BrowserRouter>

    );
}

export default App;
