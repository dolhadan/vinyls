import './App.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Keyboard, Navigation } from 'swiper/modules';
import collection from './collections.json';
import { useState } from 'react';
import classNames from 'classnames';

export default function App() {
    const [recordsField, setRecordsField] = useState<'records' | 'wishlist'>('records');
    const records = collection[recordsField];
    return (
        <div className="container">
            <div className="header">
                <div className={'segmentedControl'}>
                    <div
                        className={classNames({ activeSegmentButton: recordsField === 'records' })}
                        onClick={() => {
                            setRecordsField('records');
                        }}
                    >
                        owned
                    </div>
                    <div
                        className={classNames({ activeSegmentButton: recordsField === 'wishlist' })}
                        onClick={() => {
                            setRecordsField('wishlist');
                        }}
                    >
                        wishlist
                    </div>
                </div>
            </div>
            {/* Swiper Carousel */}
            <div className="carouselContainer">
                <Swiper
                    effect="slide"
                    centeredSlides={true}
                    slidesPerView={1}
                    initialSlide={records.length - 1}
                    modules={[Virtual, Keyboard, Navigation]}
                    className="swiper"
                    key={recordsField}
                    virtual
                    keyboard={{ enabled: true, onlyInViewport: false }}
                    navigation
                >
                    {records.map((vinyl, index) => (
                        <SwiperSlide
                            key={vinyl.artist}
                            className="swiperSlide"
                            virtualIndex={index}
                        >
                            <img
                                src={`/vinyls/covers/${vinyl.id}.jpg`}
                                alt={`${vinyl.artist} - ${vinyl.title}`}
                                className="coverArt"
                            />
                            <div className="albumTextContainer">
                                <p className="artistName">{vinyl.artist}</p>
                                <p className="albumName">{vinyl.title}</p>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
