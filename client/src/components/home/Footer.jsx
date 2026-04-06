import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 text-sm">
      {/* MAIN */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-4">
        
        {/* INFO */}
        <div className="space-y-1 leading-snug">
          <h1 className="text-lg font-semibold text-white">
            Star Medical
          </h1>

          <p className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5" />
            B.C.D.S Medical Market (3rd Floor ) Mikepotty, Jashore.
          </p>

          <p className="flex items-center gap-2">
            <Phone size={14} />
            +880 1797-072367
          </p>
            <p className="flex items-center gap-2">
            <Phone size={14} />
            +880 1328-152738
          </p>

          <p className="flex items-center gap-2">
            <Mail size={14} />
            support@starmedical.com
          </p>

          <p className="text-xs text-gray-400">
            Trade License: TRAD/DNCC/13766/2026
          </p>
        </div>

        {/* MAP */}
        <div>
          <iframe
            title="Star Medical Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d229.26064731228482!2d89.21095448959993!3d23.163981685545266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ff105fb294a395%3A0xc3d781046035b7f0!2sHotel%20Hasan%20International!5e0!3m2!1sen!2sbd!4v1767612993636!5m2!1sen!2sbd"
            className="w-full h-28 md:h-32 rounded-md border-0"
            loading="lazy"
          ></iframe>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-gray-700 bg-black">
        <div className="max-w-6xl mx-auto px-4 py-2 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Star Medical. All rights reserved. Powered by Utshab Technology Limited
        </div>
      </div>
    </footer>
  );
}
