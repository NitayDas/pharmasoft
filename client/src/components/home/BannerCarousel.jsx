import { useState, useEffect } from "react";

import banner1 from "../../assets/banners/medi2.jpeg";
import banner2 from "../../assets/banners/medi1.jpg";
import banner3 from "../../assets/banners/medi3.jpeg";
const banners = [
  {
    id: 1,
    image: banner1,
    title: " Online Pharmacist Consultation",
    subtitle: "আপনার স্বাস্থ্য সংক্রান্ত প্রশ্নের উত্তর দিন আমাদের বিশেষজ্ঞ ফার্মাসিস্টদের কাছে",
  },
  {
    id: 2,
    image: banner2,
    title: "Medicine at Your Doorstep",
    subtitle: "১০০% আসল ও নির্ভরযোগ্য মেডিসিন",
  },
    {
    id: 2,
    image: banner3,
    title: "Medicine at Your Doorstep",
    subtitle: "১০০% আসল ও নির্ভরযোগ্য মেডিসিন",
  },
];

export default function BannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const banner = banners[activeIndex];

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden mb-6 relative">
      
      {/* IMAGE */}
      <img
        src={banner.image}
        alt={banner.title}
        className="w-full h-full object-cover object-center"
      />

      {/* GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* TEXT CONTENT */}
      <div className="absolute inset-0 flex items-center">
        <div className="ml-12 max-w-md text-white">
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            {banner.title}
          </h2>
          <p className="text-base opacity-95">
            {banner.subtitle}
          </p>
        </div>
      </div>

      {/* DOT INDICATORS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <span
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-2 rounded-full cursor-pointer ${
              index === activeIndex ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>

    </div>
  );
}
