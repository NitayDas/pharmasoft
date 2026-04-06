import BannerCarousel from "../components/home/BannerCarousel";
import ProductCategories from "../components/home/ProductCategories";
import ProductSuggestions from "../components/home/ProductSuggestions";

export default function Home() {
  return (
    <div className="flex gap-6 px-6 py-4">
      {/* Main Content */}
      <div className="flex-1">
        <BannerCarousel />
        <ProductCategories />
        <ProductSuggestions />
        
        {/* Page Content */}
        <h2 className="text-2xl font-bold mb-2">
          Diabetic Care
        </h2>
        <p className="text-gray-600">
          Products will appear here
        </p>
      </div>
    </div>
  );
}
