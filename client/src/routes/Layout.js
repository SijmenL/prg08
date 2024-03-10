// routes/home.js
import React from 'react';

import {Outlet} from "react-router-dom";

const Layout = () => {
    return (
        <div className="app flex flex-col">
            <Outlet/>
        </div>
    );
};

export default Layout;