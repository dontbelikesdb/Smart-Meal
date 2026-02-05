import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";

export default function Home() {
  const navigate = useNavigate();
  const token = getToken();

  const go = (path) => {
    if (path === "/") {
      navigate("/");
      return;
    }
    if (!token) {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  return (
    <div className="font-sans antialiased text-white bg-gray-900 min-h-screen flex flex-col relative overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://lh3.googleusercontent.com/aida-public/AB6AXuDu7F1GZildoPkQwlmkdCrVYHPKjK5xrJ1P7I88EPD4jgKyV7EL8wCH2-q-UzBOb4HZfVWXqOssKBorvvmaR-pB_Et6QZcfchxNhMUDt7mRB8uew2CwYiGFnnrvdOUe7la1ezB7OgmdSmv9du81bCB_fdfIb-uo0PYV-4AUbB9WhVCHtKDeIo51DidymHAZgwdihPQoSwOTHoKfb56NJ5jmFJ9e00TqKt44AgUq2aOORYlbn49DlzmGgBJEdZ57ci9ZPOYlejxvfRZ3)",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl backdrop-brightness-50" />
      </div>

      <nav className="hidden md:flex relative z-30 w-full px-8 lg:px-16 h-20 items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <button
          type="button"
          onClick={() => go("/")}
          className="flex items-center space-x-2"
        >
          <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-leaf text-white text-xl" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">
            SmartMeal
          </span>
        </button>

        <div className="flex items-center space-x-8">
          <button
            type="button"
            onClick={() => go("/")}
            className="text-white hover:text-brand-green transition-colors font-medium"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => go("/profile")}
            className="text-white/70 hover:text-brand-green transition-colors font-medium"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => go("/generate")}
            className="text-white/70 hover:text-brand-green transition-colors font-medium"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => go("/plan")}
            className="text-white/70 hover:text-brand-green transition-colors font-medium"
          >
            Plan
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-24 max-w-7xl mx-auto w-full pb-24 md:pb-12">
        <header className="text-center md:text-left w-full mb-12 lg:mb-20">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.1] drop-shadow-2xl">
              Eat smarter.
              <br />
              Live healthier.
            </h1>
            <p className="text-white/90 text-lg md:text-xl lg:text-2xl leading-relaxed font-medium max-w-2xl">
              Discover meals that fit your body, lifestyle, and goals — all in
              one simple, modern app designed for your wellness journey.
            </p>
            <div className="mt-10 hidden md:block">
              <button
                type="button"
                onClick={() => navigate(token ? "/profile" : "/signup")}
                className="bg-brand-green hover:bg-green-700 text-white font-bold text-xl px-12 py-5 rounded-full shadow-btn transition-all transform hover:scale-105 active:scale-95"
              >
                Continue to App
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 w-full mb-16">
          <article className="bg-white/10 backdrop-blur-md p-6 lg:p-8 flex flex-col items-center text-center shadow-card rounded-[32px] border border-white/10 hover:bg-white/15 transition-all group">
            <div className="mb-6 w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <img
                alt="Personalized"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWssMn1s-bqZKKOSTZfkN-xVoDKFBAFS5mL7xYyLETFPa6H47pyzCa9IKX9GyFuWsNPk7jKSYnW1AA6Wi5DVt7TS86qjK_u3naL3UMgk0ZFGdxfhU88NAjvHQ8C7-mNbKbpOSm7n2I4KVmp00_Lsgq8nfWFZ0Kc9ZG_u572bs-SX4qF2YSdQbseEw_U9mLh33bZdk6fKLcj2CTmAoi3p9TXts7vsag5s4iUpUvN8GLE1HBTOZJ7xixMwwORRb72fRGNZCTsE2oUbAd"
              />
            </div>
            <p className="text-sm lg:text-base font-semibold text-white leading-snug">
              Personalized meal planning based on your profile
            </p>
          </article>

          <article className="bg-white/10 backdrop-blur-md p-6 lg:p-8 flex flex-col items-center text-center shadow-card rounded-[32px] border border-white/10 hover:bg-white/15 transition-all group">
            <div className="mb-6 w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <img
                alt="Search"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgUs1JhZSiI3Oizqj2EYNfxLkGqZJnh2C2GwV3kAB0P0YTxrEcGnAdzqu9nXXUOOr6YVS6pjlICxeNv0EZailN1RVB1inJOWP5qsxaZ7R859leqofHLPvxpWavMmlprUhk1CWL-DEH0e5-XXGZRgvl5CoNa71U0fh3-xlRWz5hCkAlpBQ3ZPaDSSKE4PbRjHJzdgXSdZiSnoNbuZH35HCeQ59znuIJrrVE-_usCtyS1KlrKBl89t8lvGWA_W1hsTlp7u-qxCuD3-Fo"
              />
            </div>
            <p className="text-sm lg:text-base font-semibold text-white leading-snug">
              Search meals that match your preferences
            </p>
          </article>

          <article className="bg-white/10 backdrop-blur-md p-6 lg:p-8 flex flex-col items-center text-center shadow-card rounded-[32px] border border-white/10 hover:bg-white/15 transition-all group">
            <div className="mb-6 w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <img
                alt="Offline"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARe6UsiCkr4lIKydN1XblMtI0bEd2-Xa1UQ2_nqg7fuPMOxaNVJ6fWjqp86lvlFaFbOz2QhYbEUYTSZHRNZ4FdVfi4DHok8nwfzSgvl6hec5PCuRZR5AIpim922vLXCRtGr6EjHuNf3o_swT0Ecl2_kom0-gs_xxWVeSMmGsQwzVLt8DKm28CocyLyDY5iCAmn_YaKGJRLwe7YTxU0FmfA22Uv0jku5-Eahp4CuUTxK7zi-7AQxHj6lnKdNliA-13rnEq6ku6RqYkM"
              />
            </div>
            <p className="text-sm lg:text-base font-semibold text-white leading-snug">
              Works offline and installable like a mobile app
            </p>
          </article>

          <article className="bg-white/10 backdrop-blur-md p-6 lg:p-8 flex flex-col items-center text-center shadow-card rounded-[32px] border border-white/10 hover:bg-white/15 transition-all group">
            <div className="mb-6 w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <img
                alt="Fast"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlO7GzatH0kRCtctD790njZsae5tgq0iSUdMPmgPT6zEmmB3gN_FJjSCa8JYfeKFJl1Ky3GeAACq7PIzzu3mLPFM9PtBrRNq2fYCt5cewJt8mHHjnHTG9BTyINPzvXlPRnxs-qUgt4gYtUjid066iSPY0epEWQpTN8ARSHL_xYCU0uGAaMUf_B5uRDRb_AM1ksxhmutfunAWmBu_7VHhH6Xq88PpFRXNPMvanfNU3Lm3tYlOn_m9CC4STMpW0eRkpfEKFPH756UDfX"
              />
            </div>
            <p className="text-sm lg:text-base font-semibold text-white leading-snug">
              Fast, simple, and distraction-free experience
            </p>
          </article>
        </section>

        <div className="w-full max-w-sm mx-auto md:hidden mt-4">
          <button
            type="button"
            onClick={() => navigate(token ? "/profile" : "/signup")}
            className="w-full bg-brand-green text-white font-bold text-lg py-5 rounded-full shadow-btn active:scale-95 transition-transform"
          >
            Continue to App
          </button>
        </div>
      </main>
    </div>
  );
}
