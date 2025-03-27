import './App.css'
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Virtual } from "swiper/modules";
import collection from "./collections.json";
import {useState} from "react";

// Dummy data

export default function App() {
    const [activeIndex, setActiveIndex] = useState(collection.records.length -2)

  return (
      <div className="container">
          {/* Swiper Carousel */}
          <div className="carouselContainer">
              <Swiper
                  effect="coverflow"
                  centeredSlides={true}
                  slidesPerView={2}
                  initialSlide={activeIndex}
                  onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}
                  coverflowEffect={{
                      rotate: 0,
                      stretch: 0,
                      depth: 500,
                      modifier: 1,
                      slideShadows: false,
                  }}
                  modules={[EffectCoverflow, Virtual]}
                  // Responsive breakpoints for mobile
                  breakpoints={{
                      0: {
                          slidesPerView: 1,
                          effect: 'slide',
                      },
                      768: {
                          slidesPerView: 2,
                      },
                  }}
                  className="swiper"
                  virtual
              >
                  {collection.records.map((vinyl, index) => (
                      <SwiperSlide key={vinyl.artist} className="swiperSlide" virtualIndex={index}>
                              <img
                                  src={`/vinyls/covers/${vinyl.id}.jpg`}
                                  alt={`${vinyl.artist} - ${vinyl.title}`}
                                  className="coverArt"
                              />
                      </SwiperSlide>
                  ))}
              </Swiper>
          </div>
          <div className="albumTextContainer">
              <p className="artistName">{collection.records[activeIndex].artist}</p>
              <p className="albumName">{collection.records[activeIndex].title}</p>
          </div>
      </div>
  );
}