import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import AdminOnlyRoute from "./components/AdminOnlyRoute";
import AboutHero from "./pages/AboutHero";
import AboutStory from "./pages/AboutStory";
import AboutFounder from "./pages/AboutFounder";
import AboutWorkLogo from "./pages/AboutWorkLogo";
import AboutVisionMission from "./pages/AboutVisionMission";
import AboutSpecial from "./pages/AboutSpecial";
import AboutBoard from "./pages/AboutBoard";
import AboutTestimonial from "./pages/AboutTestimonial";
import HomeMain from "./pages/HomeMain";
import HomeAbout from "./pages/HomeAbout";
import HomeLogos from "./pages/HomeLogos";
import HomeVillaPlan from "./pages/HomeVillaPlan";
import HomeChooseUs from "./pages/HomeChooseUs";
import HomeGallery from "./pages/HomeGallery";
import HomeOurTeam from "./pages/HomeOurTeam";
import HomeTestimonial from "./pages/HomeTestimonial";
import HomeFAQ from "./pages/HomeFAQ";
import GalleryHero from "./pages/GalleryHero";
import GalleryImages from "./pages/GalleryImages";
import KiwanoHero from "./pages/KiwanoHero";
import KiwanoLuxuryVillas from "./pages/KiwanoLuxuryVillas";
import KiwanoFeature from "./pages/KiwanoFeature";
import KiwanoTour360 from "./pages/KiwanoTour360";
import KiwanoGallery from "./pages/KiwanoGallery";
import KiwanoAmenities from "./pages/KiwanoAmenities";
import KiwanoOtherProjects from "./pages/KiwanoOtherProjects";
import KiwanoHighlights from "./pages/KiwanoHighlights";
import KiwanoVHero from "./pages/KiwanoVHero";
import KiwanoVLuxuryVillas from "./pages/KiwanoVLuxuryVillas";
import KiwanoVFeatures from "./pages/KiwanoVFeatures";
import KiwanoV360Tour from "./pages/KiwanoV360Tour";
import KiwanoVGallery from "./pages/KiwanoVGallery";
import KiwanoVAmenities from "./pages/KiwanoVAmenities";
import KiwanoVOtherProjects from "./pages/KiwanoVOtherProjects";
import KiwanoVHighlights from "./pages/KiwanoVHighlights";
import ProjectsHero from "./pages/ProjectsHero";
import ProjectsList from "./pages/ProjectsList";
import ServiceHero from "./pages/ServiceHero";
import TestimonialsHero from "./pages/TestimonialsHero";
import ClientReview from "./pages/ClientReview";
import ServiceCards from "./pages/ServiceCards";
import ServiceTestimonial from "./pages/ServiceTestimonial";
import ContactHero from "./pages/ContactHero";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Placeholder pages for future sections
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-64 animate-fade-in">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-surface-border flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-gray-500 text-sm mt-1">Coming soon — page under construction</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1f35",
                color: "#f3f4f6",
                border: "1px solid #2a3158",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#2952ff", secondary: "#fff" } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/home/hero" element={<HomeMain />} />
                <Route path="/home/about" element={<HomeAbout />} />
                <Route path="/home/logos" element={<HomeLogos />} />
                <Route path="/home/villaplan" element={<HomeVillaPlan />} />
                <Route path="/home/chooseus" element={<HomeChooseUs />} />
                <Route path="/home/gallery" element={<HomeGallery />} />
                <Route path="/home/team" element={<HomeOurTeam />} />
                <Route path="/home/testimonial" element={<HomeTestimonial />} />
                <Route path="/home/faq" element={<HomeFAQ />} />
                
                {/* About Us Routes */}
                <Route path="/about/hero" element={<AboutHero />} />
                <Route path="/about/story" element={<AboutStory />} />
                <Route path="/about/founder" element={<AboutFounder />} />
                <Route path="/about/worklogo" element={<AboutWorkLogo />} />
                <Route path="/about/visionmission" element={<AboutVisionMission />} />
                <Route path="/about/special" element={<AboutSpecial />} />
                <Route path="/about/board" element={<AboutBoard />} />
                <Route path="/about/testimonial" element={<AboutTestimonial />} />

                {/* Gallery Routes */}
                <Route path="/gallery/hero" element={<GalleryHero />} />
                <Route path="/gallery/images" element={<GalleryImages />} />

                {/* Kiwano Routes */}
                <Route path="/kiwano/hero" element={<KiwanoHero />} />
                <Route path="/kiwano/luxuryvillas" element={<KiwanoLuxuryVillas />} />
                <Route path="/kiwano/feature" element={<KiwanoFeature />} />
                <Route path="/kiwano/360tour" element={<KiwanoTour360 />} />
                <Route path="/kiwano/gallery" element={<KiwanoGallery />} />
                <Route path="/kiwano/amenities" element={<KiwanoAmenities />} />
                <Route path="/kiwano/otherprojects" element={<KiwanoOtherProjects />} />
                <Route path="/kiwano/highlights" element={<KiwanoHighlights />} />

                {/* Kiwano Villament Routes */}
                <Route path="/kiwano-villament/hero" element={<KiwanoVHero />} />
                <Route path="/kiwano-villament/luxuryvillas" element={<KiwanoVLuxuryVillas />} />
                <Route path="/kiwano-villament/feature" element={<KiwanoVFeatures />} />
                <Route path="/kiwano-villament/360tour" element={<KiwanoV360Tour />} />
                <Route path="/kiwano-villament/gallery" element={<KiwanoVGallery />} />
                <Route path="/kiwano-villament/amenities" element={<KiwanoVAmenities />} />
                <Route path="/kiwano-villament/otherprojects" element={<KiwanoVOtherProjects />} />
                <Route path="/kiwano-villament/highlights" element={<KiwanoVHighlights />} />

                {/* Projects Routes */}
                <Route path="/projects/hero" element={<ProjectsHero />} />
                <Route path="/projects/list" element={<ProjectsList />} />

                {/* Services Routes */}
                <Route path="/services/hero" element={<ServiceHero />} />
                <Route path="/services/cards" element={<ServiceCards />} />
                <Route path="/services/testimonial" element={<ServiceTestimonial />} />
                <Route path="/blogs" element={<Placeholder title="Blogs" />} />

                {/* Testimonials Routes */}
                <Route path="/testimonials/hero" element={<TestimonialsHero />} />
                <Route path="/testimonials/review" element={<ClientReview />} />
                {/* Contacts Routes */}
                <Route path="/contacts/hero" element={<ContactHero />} />
                {/* Admin-only routes */}
                <Route element={<AdminOnlyRoute />}>
                  <Route path="/users" element={<UserManagement />} />
                </Route>
                <Route path="/settings" element={<Placeholder title="Settings" />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
