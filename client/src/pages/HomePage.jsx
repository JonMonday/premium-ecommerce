import React from 'react';
import Hero from '../components/Hero/Hero';
import TopProducts from '../components/TopProducts/TopProducts';
import TopReviews from '../components/TopReviews/TopReviews';
import Newsletter from '../components/Newsletter/Newsletter';
import Collections from '../components/Collections/Collections';
import Promotions from '../components/Promotions/Promotions';

const HomePage = () => {
    return (
        <div className="home-page">
            <Hero />
            {/* <Collections /> */}
            <TopProducts />
            {/* <TopReviews /> */}
            <Promotions />
            <Newsletter />
        </div>
    );
};

export default HomePage;
