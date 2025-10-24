import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div
      className="flex min-h-screen flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
